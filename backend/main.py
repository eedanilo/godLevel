"""
FastAPI Backend para Analytics de Restaurantes
Sistema de query builder e analytics customizável
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import asyncpg
import os
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from decimal import Decimal
import json
import time

# Configuração
# Conectar ao PostgreSQL no Docker
# IMPORTANTE: Usar 127.0.0.1 em vez de localhost para garantir conexão ao Docker
# Se estiver rodando dentro do Docker, usar 'postgres' como host
# Se estiver rodando localmente, usar '127.0.0.1' (não 'localhost')
DATABASE_HOST = os.getenv("DATABASE_HOST", "127.0.0.1")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://challenge:challenge_2024@{DATABASE_HOST}:5432/challenge_db"
)

# Pool de conexões
db_pool: Optional[asyncpg.Pool] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia ciclo de vida da aplicação"""
    global db_pool
    # Conectar ao banco
    db_pool = await asyncpg.create_pool(
        DATABASE_URL,
        min_size=2,
        max_size=10,
        command_timeout=60
    )
    yield
    # Fechar pool
    if db_pool:
        await db_pool.close()


app = FastAPI(
    title="God Level Analytics API",
    description="API para analytics customizável de restaurantes",
    version="1.0.0",
    lifespan=lifespan
)

# Importar rotas de autenticação
from app.api.routes import auth
app.include_router(auth.router)
from app.api.routes.auth import get_current_user

# CORS - Permitir requisições do frontend (local e Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",
        "*"  # Em produção, substitua por domínios específicos
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_db():
    """Dependency para obter conexão do pool"""
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")
    return db_pool


def get_user_store_id(current_user: Optional[dict] = None) -> Optional[int]:
    """Helper para obter store_id do usuário atual (se for gerente)"""
    if current_user and current_user.get("role") == "manager":
        return current_user.get("store_id")
    return None


def add_store_filter_if_needed(conditions: List[str], params_list: List[Any], param_num: int, current_user: Optional[dict] = None) -> int:
    """Adiciona filtro de loja se o usuário for gerente"""
    store_id = get_user_store_id(current_user)
    if store_id:
        conditions.append(f"store_id = ${param_num}")
        params_list.append(store_id)
        param_num += 1
    return param_num


# ============================================================================
# Modelos Pydantic
# ============================================================================

class Filter(BaseModel):
    field: str
    operator: str  # eq, ne, gt, gte, lt, lte, in, not_in, like, between
    value: Any


class Dimension(BaseModel):
    field: str
    alias: Optional[str] = None


class Metric(BaseModel):
    field: str
    aggregation: str  # sum, avg, count, min, max
    alias: Optional[str] = None


class QueryRequest(BaseModel):
    dimensions: List[Dimension] = []
    metrics: List[Metric] = []
    filters: List[Filter] = []
    time_range: Optional[Dict[str, str]] = None
    group_by: Optional[List[str]] = []
    order_by: Optional[List[Dict[str, str]]] = []
    limit: Optional[int] = 100


# ============================================================================
# Endpoints de Analytics
# ============================================================================

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "ok",
        "message": "God Level Analytics API",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health_check(db: asyncpg.Pool = Depends(get_db)):
    """Health check com verificação de DB"""
    try:
        async with db.acquire() as conn:
            await conn.fetchval("SELECT 1")
            # Testar queries diferentes para diagnosticar
            test_count1 = await conn.fetchval("SELECT COUNT(*) FROM sales WHERE sale_status_desc = $1", 'COMPLETED')
            test_count2 = await conn.fetchval("SELECT COUNT(*) FROM sales WHERE sale_status_desc = 'COMPLETED'")
            test_count3 = await conn.fetchval("SELECT COUNT(*) FROM sales")
            
            # Testar query de faturamento direta
            revenue_test = await conn.fetchrow("""
                SELECT 
                    COUNT(*)::bigint as total_orders,
                    COALESCE(SUM(total_amount), 0)::numeric as total_revenue
                FROM sales
                WHERE sale_status_desc = 'COMPLETED'
            """)
            
        return {
            "status": "ok", 
            "database": "connected", 
            "test_with_param": test_count1,
            "test_with_string": test_count2,
            "test_all_sales": test_count3,
            "revenue_test": dict(revenue_test) if revenue_test else None
        }
    except Exception as e:
        import traceback
        return {"status": "error", "database": "disconnected", "error": str(e), "traceback": traceback.format_exc()}


@app.get("/api/meta/tables")
async def get_tables(db: asyncpg.Pool = Depends(get_db)):
    """Retorna lista de tabelas disponíveis"""
    try:
        async with db.acquire() as conn:
            tables = await conn.fetch("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """)
            return {"tables": [t["table_name"] for t in tables]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/meta/columns/{table_name}")
async def get_columns(table_name: str, db: asyncpg.Pool = Depends(get_db)):
    """Retorna colunas de uma tabela"""
    try:
        async with db.acquire() as conn:
            columns = await conn.fetch("""
                SELECT 
                    column_name,
                    data_type,
                    is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = $1
                ORDER BY ordinal_position
            """, table_name)
            return {
                "table": table_name,
                "columns": [
                    {
                        "name": c["column_name"],
                        "type": c["data_type"],
                        "nullable": c["is_nullable"] == "YES"
                    }
                    for c in columns
                ]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/meta/channels")
async def get_channels(db: asyncpg.Pool = Depends(get_db)):
    """Retorna lista de canais disponíveis (únicos por nome e tipo)"""
    try:
        async with db.acquire() as conn:
            # Retornar apenas canais únicos por nome e tipo, pegando o ID mínimo como representante
            channels = await conn.fetch("""
                SELECT DISTINCT ON (name, type)
                    MIN(id) OVER (PARTITION BY name, type) as id,
                    name,
                    type,
                    description
                FROM channels
                ORDER BY name, type, id
            """)
            
            # Alternativamente, usar GROUP BY para garantir unicidade
            # Se DISTINCT ON não funcionar bem, usar esta query:
            # channels = await conn.fetch("""
            #     SELECT 
            #         MIN(id) as id,
            #         name,
            #         type,
            #         MAX(description) as description
            #     FROM channels
            #     GROUP BY name, type
            #     ORDER BY name, type
            # """)
            
            # Remover duplicatas se ainda houver (fallback)
            seen = set()
            unique_channels = []
            for c in channels:
                key = (str(c["name"]), str(c["type"]) if c["type"] else "")
                if key not in seen:
                    seen.add(key)
                    unique_channels.append(c)
            
            return {
                "channels": [
                    {
                        "id": int(c["id"]),
                        "name": str(c["name"]),
                        "type": str(c["type"]) if c["type"] else "",
                        "description": str(c["description"]) if c["description"] else ""
                    }
                    for c in unique_channels
                ]
            }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/meta/stores")
async def get_stores(db: asyncpg.Pool = Depends(get_db)):
    """Retorna lista de lojas disponíveis"""
    try:
        async with db.acquire() as conn:
            stores = await conn.fetch("""
                SELECT 
                    id,
                    name,
                    city,
                    state
                FROM stores
                WHERE is_active = true
                ORDER BY name, city
            """)
            
            return {
                "stores": [
                    {
                        "id": int(s["id"]),
                        "name": str(s["name"]),
                        "city": str(s["city"]) if s["city"] else "",
                        "state": str(s["state"]) if s["state"] else ""
                    }
                    for s in stores
                ]
            }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/meta/products")
async def get_products(
    limit: int = 100,
    search: Optional[str] = None,
    db: asyncpg.Pool = Depends(get_db)
):
    """Retorna lista de produtos disponíveis"""
    try:
        async with db.acquire() as conn:
            if search:
                query = """
                    SELECT DISTINCT
                        p.id,
                        p.name,
                        c.name as category_name
                    FROM products p
                    LEFT JOIN categories c ON c.id = p.category_id
                    WHERE p.name ILIKE $1
                    ORDER BY p.name
                    LIMIT $2
                """
                products = await conn.fetch(query, f"%{search}%", limit)
            else:
                query = """
                    SELECT DISTINCT
                        p.id,
                        p.name,
                        c.name as category_name
                    FROM products p
                    LEFT JOIN categories c ON c.id = p.category_id
                    ORDER BY p.name
                    LIMIT $1
                """
                products = await conn.fetch(query, limit)
            
            return {
                "products": [
                    {
                        "id": int(p["id"]),
                        "name": str(p["name"]),
                        "category": str(p["category_name"]) if p["category_name"] else ""
                    }
                    for p in products
                ]
            }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/query")
async def execute_query(query: QueryRequest, db: asyncpg.Pool = Depends(get_db)):
    """
    Executa query dinâmica usando query builder
    """
    import logging
    from app.utils.query_validation import validate_query_request
    
    logger = logging.getLogger(__name__)
    
    try:
        # Validate query request
        query_dict = query.dict() if hasattr(query, 'dict') else query
        is_valid, error_msg = validate_query_request(query_dict)
        
        if not is_valid:
            error_detail = error_msg if error_msg else "Invalid query request"
            logger.warning(f"Invalid query request: {error_detail}", extra={"query": query_dict})
            raise HTTPException(status_code=400, detail=error_detail)
        
        logger.info("Executing query builder request", extra={
            "dimensions_count": len(query.dimensions or []),
            "metrics_count": len(query.metrics or []),
            "filters_count": len(query.filters or []),
        })
        
        # Construir query SQL
        sql_query = build_query(query)
        
        logger.debug(f"Generated SQL query: {sql_query['sql'][:200]}...")
        
        async with db.acquire() as conn:
            results = await conn.fetch(sql_query["sql"], *sql_query["params"])
            
            # Converter resultados para dict
            data = [dict(r) for r in results]
            
            logger.info(f"Query executed successfully. Returned {len(data)} rows")
            
            return {
                "data": data,
                "count": len(data),
                "query": sql_query["sql"]
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing query: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def build_query(query: QueryRequest) -> Dict[str, Any]:
    """
    Constrói SQL dinâmico baseado no QueryRequest
    """
    from app.utils.query_validation import sanitize_field_name
    
    # Query base - começamos com a tabela sales
    base_table = "sales"
    
    # SELECT clause
    select_parts = []
    
    # Adicionar dimensões (sanitized)
    for dim in query.dimensions:
        field = sanitize_field_name(dim.field)
        alias = sanitize_field_name(dim.alias) if dim.alias else sanitize_field_name(dim.field)
        select_parts.append(f"{field} as {alias}")
    
    # Adicionar métricas (sanitized)
    for metric in query.metrics:
        field = sanitize_field_name(metric.field)
        alias = sanitize_field_name(metric.alias) if metric.alias else sanitize_field_name(f"{metric.aggregation}_{metric.field}")
        aggregation_func = {
            "sum": "SUM",
            "avg": "AVG",
            "count": "COUNT",
            "min": "MIN",
            "max": "MAX"
        }.get(metric.aggregation.lower(), "SUM")
        select_parts.append(f"{aggregation_func}({field}) as {alias}")
    
    if not select_parts:
        select_parts.append("*")
    
    # FROM clause
    from_clause = f"FROM {base_table}"
    
    # JOINs necessários
    joins = []
    joins_needed = set()
    
    # Verificar se precisa de joins baseado nos campos usados
    fields_used = [d.field for d in query.dimensions] + [m.field for m in query.metrics]
    for field in fields_used:
        if "." in field:
            table = field.split(".")[0]
            if table not in [base_table, ""] and table not in joins_needed:
                joins_needed.add(table)
    
    # Adicionar joins comuns
    if any("store" in f.lower() or "loja" in f.lower() for f in fields_used):
        joins.append("LEFT JOIN stores st ON st.id = sales.store_id")
    if any("channel" in f.lower() or "canal" in f.lower() for f in fields_used):
        joins.append("LEFT JOIN channels ch ON ch.id = sales.channel_id")
    if any("customer" in f.lower() or "cliente" in f.lower() for f in fields_used):
        joins.append("LEFT JOIN customers c ON c.id = sales.customer_id")
    
    # WHERE clause
    where_parts = []
    params = []
    param_idx = 1
    
    # Filtros de tempo
    if query.time_range:
        start_date = query.time_range.get("start")
        end_date = query.time_range.get("end")
        if start_date:
            # Converter string para objeto date do Python
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            where_parts.append(f"created_at >= ${param_idx}")
            params.append(start_date_obj)
            param_idx += 1
        if end_date:
            # Converter string para objeto date do Python e adicionar 1 dia
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
            end_date_obj = end_date_obj + timedelta(days=1)
            where_parts.append(f"created_at < ${param_idx}")
            params.append(end_date_obj)
            param_idx += 1
    
    # Filtros customizados (sanitized)
    for filter_obj in query.filters:
        field = sanitize_field_name(filter_obj.field)
        operator = filter_obj.operator.lower()
        value = filter_obj.value
        
        # Sanitize value (using parameterized queries prevents SQL injection, but validate anyway)
        from app.utils.query_validation import sanitize_sql_value
        try:
            sanitized_value = sanitize_sql_value(value)
        except ValueError as e:
            raise ValueError(f"Invalid filter value: {e}")
        
        if operator == "eq":
            where_parts.append(f"{field} = ${param_idx}")
            params.append(sanitized_value)
            param_idx += 1
        elif operator == "ne":
            where_parts.append(f"{field} != ${param_idx}")
            params.append(sanitized_value)
            param_idx += 1
        elif operator == "gt":
            where_parts.append(f"{field} > ${param_idx}")
            params.append(sanitized_value)
            param_idx += 1
        elif operator == "gte":
            where_parts.append(f"{field} >= ${param_idx}")
            params.append(sanitized_value)
            param_idx += 1
        elif operator == "lt":
            where_parts.append(f"{field} < ${param_idx}")
            params.append(sanitized_value)
            param_idx += 1
        elif operator == "lte":
            where_parts.append(f"{field} <= ${param_idx}")
            params.append(sanitized_value)
            param_idx += 1
        elif operator == "in":
            if not isinstance(sanitized_value, list):
                raise ValueError("IN operator requires a list of values")
            sanitized_list = [sanitize_sql_value(v) for v in sanitized_value]
            placeholders = ",".join([f"${i}" for i in range(param_idx, param_idx + len(sanitized_list))])
            where_parts.append(f"{field} IN ({placeholders})")
            params.extend(sanitized_list)
            param_idx += len(sanitized_list)
        elif operator == "like":
            where_parts.append(f"{field} ILIKE ${param_idx}")
            params.append(f"%{sanitized_value}%")
            param_idx += 1
        elif operator == "between":
            if not isinstance(sanitized_value, list) or len(sanitized_value) != 2:
                raise ValueError("BETWEEN operator requires a list of 2 values")
            sanitized_range = [sanitize_sql_value(v) for v in sanitized_value]
            where_parts.append(f"{field} BETWEEN ${param_idx} AND ${param_idx + 1}")
            params.extend(sanitized_range)
            param_idx += 2
    
    # Status padrão - apenas vendas completadas
    if not any(f.field == "sale_status_desc" for f in query.filters):
        where_parts.append("sale_status_desc = 'COMPLETED'")
    
    # GROUP BY (sanitized)
    group_by_parts = []
    if query.group_by:
        group_by_parts.extend([sanitize_field_name(f) for f in query.group_by])
    elif query.metrics:  # Se há métricas, precisa group by nas dimensões
        group_by_parts.extend([sanitize_field_name(d.field) for d in query.dimensions])
    
    # ORDER BY (sanitized)
    order_by_parts = []
    if query.order_by:
        for order in query.order_by:
            field = sanitize_field_name(order.get("field"))
            direction = order.get("direction", "ASC").upper()
            if direction not in {"ASC", "DESC"}:
                direction = "ASC"
            order_by_parts.append(f"{field} {direction}")
    
    # Montar query final
    sql = f"SELECT {', '.join(select_parts)}"
    sql += f" {from_clause}"
    
    if joins:
        sql += " " + " ".join(joins)
    
    if where_parts:
        sql += f" WHERE {' AND '.join(where_parts)}"
    
    if group_by_parts:
        sql += f" GROUP BY {', '.join(group_by_parts)}"
    
    if order_by_parts:
        sql += f" ORDER BY {', '.join(order_by_parts)}"
    
    if query.limit:
        sql += f" LIMIT {query.limit}"
    
    return {"sql": sql, "params": params}


# ============================================================================
# Endpoints de Métricas Pré-definidas
# ============================================================================

@app.get("/api/metrics/revenue")
async def get_revenue(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    store_id: Optional[int] = None,
    channel_id: Optional[int] = None,
    channel_ids: Optional[str] = None,
    db: asyncpg.Pool = Depends(get_db)
):
    """Faturamento agregado"""
    import logging
    logger = logging.getLogger(__name__)
    start_time = time.time()
    
    try:
        # Parse channel_ids from comma-separated string
        channel_id_list = None
        if channel_ids:
            try:
                channel_id_list = [int(cid.strip()) for cid in channel_ids.split(',') if cid.strip()]
            except ValueError:
                channel_id_list = None
        
        logger.info("Revenue endpoint called", extra={
            "start_date": start_date,
            "end_date": end_date,
            "store_id": store_id,
            "channel_id": channel_id,
            "channel_ids": channel_id_list,
        })
        async with db.acquire() as conn:
            # Construir WHERE clause dinamicamente
            conditions = ["sale_status_desc = 'COMPLETED'"]
            params_list = []
            param_num = 1
            
            if start_date:
                # Converter string para objeto date do Python
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                conditions.append(f"created_at >= ${param_num}")
                params_list.append(start_date_obj)
                param_num += 1
            
            if end_date:
                # Converter string para objeto date do Python e adicionar 1 dia
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
                end_date_obj = end_date_obj + timedelta(days=1)
                conditions.append(f"created_at < ${param_num}")
                params_list.append(end_date_obj)
                param_num += 1
            
            if store_id:
                conditions.append(f"store_id = ${param_num}")
                params_list.append(store_id)
                param_num += 1
            
            # Use channel_ids if provided, otherwise use channel_id (single)
            if channel_id_list:
                placeholders = ",".join([f"${i}" for i in range(param_num, param_num + len(channel_id_list))])
                conditions.append(f"channel_id IN ({placeholders})")
                params_list.extend(channel_id_list)
                param_num += len(channel_id_list)
            elif channel_id:
                conditions.append(f"channel_id = ${param_num}")
                params_list.append(channel_id)
                param_num += 1
            
            where_sql = " AND ".join(conditions)
            
            query = f"""
                SELECT 
                    COUNT(*)::bigint as total_orders,
                    COALESCE(SUM(total_amount), 0)::numeric as total_revenue,
                    COALESCE(AVG(total_amount), 0)::numeric as avg_ticket,
                    COALESCE(SUM(total_amount_items), 0)::numeric as gross_revenue,
                    COALESCE(SUM(total_discount), 0)::numeric as total_discounts,
                    COALESCE(SUM(delivery_fee), 0)::numeric as total_delivery_fee,
                    COALESCE(SUM(service_tax_fee), 0)::numeric as total_service_fee
                FROM sales
                WHERE {where_sql}
            """
            
            # Executar query - sem parâmetros se não houver filtros adicionais
            if params_list:
                result = await conn.fetchrow(query, *params_list)
            else:
                result = await conn.fetchrow(query)
            
            if result is None:
                return {}
            
            # Converter Record para dict
            result_dict = {}
            for key in result.keys():
                value = result[key]
                if value is None:
                    result_dict[key] = 0 if key == 'total_orders' else 0.0
                elif isinstance(value, Decimal):
                    result_dict[key] = float(value) if key != 'total_orders' else int(value)
                elif isinstance(value, (int, float)):
                    result_dict[key] = float(value) if key != 'total_orders' else int(value)
                else:
                    # Para tipos como bigint, tentar converter
                    try:
                        if key == 'total_orders':
                            result_dict[key] = int(value)
                        else:
                            result_dict[key] = float(value)
                    except (ValueError, TypeError):
                        result_dict[key] = value
            
            elapsed_time = time.time() - start_time
            logger.info(f"Revenue query completed in {elapsed_time:.3f}s", extra={
                "elapsed_time": elapsed_time,
                "total_orders": result_dict.get("total_orders", 0),
            })
            return result_dict
    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"Revenue query failed after {elapsed_time:.3f}s: {e}", exc_info=True, extra={
            "elapsed_time": elapsed_time,
            "error": str(e),
        })
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/top-products")
async def get_top_products(
    limit: int = 10,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    order_by: str = 'quantity',
    channel_ids: Optional[str] = None,
    db: asyncpg.Pool = Depends(get_db)
):
    """Top produtos mais vendidos"""
    try:
        # Validate order_by parameter
        if order_by not in ['quantity', 'revenue']:
            order_by = 'quantity'
        
        # Parse channel_ids from comma-separated string
        channel_id_list = None
        if channel_ids:
            try:
                channel_id_list = [int(cid.strip()) for cid in channel_ids.split(',') if cid.strip()]
            except ValueError:
                channel_id_list = None
        
        async with db.acquire() as conn:
            conditions = ["s.sale_status_desc = 'COMPLETED'"]
            params_list = []
            param_num = 1
            
            if start_date:
                # Converter string para objeto date do Python
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                conditions.append(f"s.created_at >= ${param_num}")
                params_list.append(start_date_obj)
                param_num += 1
            
            if end_date:
                # Converter string para objeto date do Python e adicionar 1 dia
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
                end_date_obj = end_date_obj + timedelta(days=1)
                conditions.append(f"s.created_at < ${param_num}")
                params_list.append(end_date_obj)
                param_num += 1
            
            if channel_id_list:
                placeholders = ",".join([f"${i}" for i in range(param_num, param_num + len(channel_id_list))])
                conditions.append(f"s.channel_id IN ({placeholders})")
                params_list.extend(channel_id_list)
                param_num += len(channel_id_list)
            
            where_sql = " AND ".join(conditions)
            
            # Query without LIMIT first, then order in Python and limit
            query = f"""
                SELECT 
                    p.id,
                    p.name as product_name,
                    c.name as category_name,
                    SUM(ps.quantity)::numeric as total_quantity,
                    SUM(ps.total_price)::numeric as total_revenue,
                    COUNT(DISTINCT ps.sale_id) as order_count
                FROM product_sales ps
                JOIN sales s ON s.id = ps.sale_id
                JOIN products p ON p.id = ps.product_id
                LEFT JOIN categories c ON c.id = p.category_id
                WHERE {where_sql}
                GROUP BY p.id, p.name, c.name
            """
            
            if params_list:
                results = await conn.fetch(query, *params_list)
            else:
                results = await conn.fetch(query)
            
            # Format results
            formatted_results = [
                {
                    "id": int(r["id"]) if r["id"] else 0,
                    "product_name": str(r["product_name"]) if r["product_name"] else "",
                    "category_name": str(r["category_name"]) if r["category_name"] else None,
                    "total_quantity": float(r["total_quantity"]) if r["total_quantity"] else 0.0,
                    "total_revenue": float(r["total_revenue"]) if r["total_revenue"] else 0.0,
                    "order_count": int(r["order_count"]) if r["order_count"] else 0
                }
                for r in results
            ]
            
            # Sort in Python to ensure correct ordering
            if order_by == 'quantity':
                formatted_results.sort(key=lambda x: x['total_quantity'], reverse=True)
            elif order_by == 'revenue':
                formatted_results.sort(key=lambda x: x['total_revenue'], reverse=True)
            
            # Limit after sorting
            formatted_results = formatted_results[:limit]
            
            return {"products": formatted_results}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/peak-hours")
async def get_peak_hours(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    channel_ids: Optional[str] = None,
    db: asyncpg.Pool = Depends(get_db)
):
    """Análise de horários de pico"""
    try:
        # Parse channel_ids from comma-separated string
        channel_id_list = None
        if channel_ids:
            try:
                channel_id_list = [int(cid.strip()) for cid in channel_ids.split(',') if cid.strip()]
            except ValueError:
                channel_id_list = None
        
        async with db.acquire() as conn:
            conditions = ["sale_status_desc = 'COMPLETED'"]
            params_list = []
            param_num = 1
            
            if start_date:
                # Converter string para objeto date do Python
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                conditions.append(f"created_at >= ${param_num}")
                params_list.append(start_date_obj)
                param_num += 1
            
            if end_date:
                # Converter string para objeto date do Python e adicionar 1 dia
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
                end_date_obj = end_date_obj + timedelta(days=1)
                conditions.append(f"created_at < ${param_num}")
                params_list.append(end_date_obj)
                param_num += 1
            
            if channel_id_list:
                placeholders = ",".join([f"${i}" for i in range(param_num, param_num + len(channel_id_list))])
                conditions.append(f"channel_id IN ({placeholders})")
                params_list.extend(channel_id_list)
                param_num += len(channel_id_list)
            
            where_sql = " AND ".join(conditions)
            
            query = f"""
                SELECT 
                    EXTRACT(HOUR FROM created_at)::integer as hour,
                    COUNT(*)::bigint as order_count,
                    COALESCE(SUM(total_amount), 0)::numeric as revenue,
                    COALESCE(AVG(total_amount), 0)::numeric as avg_ticket
                FROM sales
                WHERE {where_sql}
                GROUP BY EXTRACT(HOUR FROM created_at)
                ORDER BY hour
            """
            
            if params_list:
                results = await conn.fetch(query, *params_list)
            else:
                results = await conn.fetch(query)
            
            # Converter resultados
            hours_data = []
            for r in results:
                hours_data.append({
                    'hour': int(r['hour']) if r['hour'] is not None else 0,
                    'order_count': int(r['order_count']) if r['order_count'] is not None else 0,
                    'revenue': float(r['revenue']) if r['revenue'] is not None else 0.0,
                    'avg_ticket': float(r['avg_ticket']) if r['avg_ticket'] is not None else 0.0,
                })
            
            return {"hours": hours_data}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/store-performance")
async def get_store_performance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    channel_ids: Optional[str] = None,
    db: asyncpg.Pool = Depends(get_db)
):
    """Performance por loja"""
    try:
        # Parse channel_ids from comma-separated string
        channel_id_list = None
        if channel_ids:
            try:
                channel_id_list = [int(cid.strip()) for cid in channel_ids.split(',') if cid.strip()]
            except ValueError:
                channel_id_list = None
        
        async with db.acquire() as conn:
            conditions = ["s.sale_status_desc = 'COMPLETED'"]
            params_list = []
            param_num = 1
            
            if start_date:
                # Converter string para objeto date do Python
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                conditions.append(f"s.created_at >= ${param_num}")
                params_list.append(start_date_obj)
                param_num += 1
            
            if end_date:
                # Converter string para objeto date do Python e adicionar 1 dia
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
                end_date_obj = end_date_obj + timedelta(days=1)
                conditions.append(f"s.created_at < ${param_num}")
                params_list.append(end_date_obj)
                param_num += 1
            
            if channel_id_list:
                placeholders = ",".join([f"${i}" for i in range(param_num, param_num + len(channel_id_list))])
                conditions.append(f"s.channel_id IN ({placeholders})")
                params_list.extend(channel_id_list)
                param_num += len(channel_id_list)
            
            where_sql = " AND ".join(conditions)
            
            query = f"""
                SELECT 
                    st.id,
                    st.name as store_name,
                    st.city,
                    st.state,
                    COUNT(*)::bigint as total_orders,
                    COALESCE(SUM(s.total_amount), 0)::numeric as total_revenue,
                    COALESCE(AVG(s.total_amount), 0)::numeric as avg_ticket,
                    COALESCE(AVG(s.production_seconds), 0)::numeric as avg_production_time,
                    COALESCE(AVG(s.delivery_seconds), 0)::numeric as avg_delivery_time
                FROM sales s
                JOIN stores st ON st.id = s.store_id
                WHERE {where_sql}
                GROUP BY st.id, st.name, st.city, st.state
                ORDER BY total_revenue DESC
            """
            
            if params_list:
                results = await conn.fetch(query, *params_list)
            else:
                results = await conn.fetch(query)
            
            # Converter resultados
            stores_data = []
            for r in results:
                stores_data.append({
                    'id': int(r['id']) if r['id'] is not None else 0,
                    'store_name': str(r['store_name']) if r['store_name'] else '',
                    'city': str(r['city']) if r['city'] else '',
                    'state': str(r['state']) if r['state'] else '',
                    'total_orders': int(r['total_orders']) if r['total_orders'] is not None else 0,
                    'total_revenue': float(r['total_revenue']) if r['total_revenue'] is not None else 0.0,
                    'avg_ticket': float(r['avg_ticket']) if r['avg_ticket'] is not None else 0.0,
                    'avg_production_time': float(r['avg_production_time']) if r['avg_production_time'] is not None else 0.0,
                    'avg_delivery_time': float(r['avg_delivery_time']) if r['avg_delivery_time'] is not None else 0.0,
                })
            
            return {"stores": stores_data}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/channel-comparison")
async def get_channel_comparison(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: asyncpg.Pool = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Comparação entre canais com porcentagem do faturamento"""
    try:
        async with db.acquire() as conn:
            conditions = ["s.sale_status_desc = 'COMPLETED'"]
            params_list = []
            param_num = 1
            
            if start_date:
                # Converter string para objeto date do Python
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                conditions.append(f"s.created_at >= ${param_num}")
                params_list.append(start_date_obj)
                param_num += 1
            
            if end_date:
                # Converter string para objeto date do Python e adicionar 1 dia
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
                end_date_obj = end_date_obj + timedelta(days=1)
                conditions.append(f"s.created_at < ${param_num}")
                params_list.append(end_date_obj)
                param_num += 1
            
            # Add store filter if user is a manager
            param_num = add_store_filter_if_needed(conditions, params_list, param_num, current_user)
            
            where_sql = " AND ".join(conditions)
            
            # Primeiro, calcular o total geral para calcular porcentagens
            total_query = f"""
                SELECT 
                    COALESCE(SUM(s.total_amount), 0)::numeric as total_revenue
                FROM sales s
                WHERE {where_sql}
            """
            if params_list:
                total_result = await conn.fetchrow(total_query, *params_list)
            else:
                total_result = await conn.fetchrow(total_query)
            
            total_revenue = float(total_result['total_revenue']) if total_result and total_result['total_revenue'] else 0.0
            
            query = f"""
                SELECT 
                    ch.id,
                    ch.name as channel_name,
                    ch.type as channel_type,
                    COUNT(*)::bigint as total_orders,
                    COALESCE(SUM(s.total_amount), 0)::numeric as total_revenue,
                    COALESCE(AVG(s.total_amount), 0)::numeric as avg_ticket,
                    COALESCE(SUM(s.delivery_fee), 0)::numeric as total_delivery_fee,
                    COALESCE(AVG(s.delivery_seconds), 0)::numeric as avg_delivery_time
                FROM sales s
                JOIN channels ch ON ch.id = s.channel_id
                WHERE {where_sql}
                GROUP BY ch.id, ch.name, ch.type
                ORDER BY total_revenue DESC
            """
            
            if params_list:
                results = await conn.fetch(query, *params_list)
            else:
                results = await conn.fetch(query)
            
            # Converter resultados e calcular porcentagem
            channels_data = []
            for r in results:
                channel_revenue = float(r['total_revenue']) if r['total_revenue'] is not None else 0.0
                percentage = (channel_revenue / total_revenue * 100) if total_revenue > 0 else 0.0
                
                channels_data.append({
                    'id': int(r['id']) if r['id'] is not None else 0,
                    'channel_name': str(r['channel_name']) if r['channel_name'] else '',
                    'channel_type': str(r['channel_type']) if r['channel_type'] else '',
                    'total_orders': int(r['total_orders']) if r['total_orders'] is not None else 0,
                    'total_revenue': channel_revenue,
                    'revenue_percentage': round(percentage, 2),
                    'avg_ticket': float(r['avg_ticket']) if r['avg_ticket'] is not None else 0.0,
                    'total_delivery_fee': float(r['total_delivery_fee']) if r['total_delivery_fee'] is not None else 0.0,
                    'avg_delivery_time': float(r['avg_delivery_time']) if r['avg_delivery_time'] is not None else 0.0,
                })
            
            return {"channels": channels_data, "total_revenue": total_revenue}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/daily-trends")
async def get_daily_trends(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    channel_ids: Optional[str] = None,
    db: asyncpg.Pool = Depends(get_db)
):
    """Tendências diárias"""
    try:
        # Parse channel_ids from comma-separated string
        channel_id_list = None
        if channel_ids:
            try:
                channel_id_list = [int(cid.strip()) for cid in channel_ids.split(',') if cid.strip()]
            except ValueError:
                channel_id_list = None
        
        async with db.acquire() as conn:
            conditions = ["sale_status_desc = 'COMPLETED'"]
            params_list = []
            param_num = 1
            
            if start_date:
                # Converter string para objeto date do Python
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                conditions.append(f"created_at >= ${param_num}")
                params_list.append(start_date_obj)
                param_num += 1
            
            if end_date:
                # Converter string para objeto date do Python e adicionar 1 dia
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
                end_date_obj = end_date_obj + timedelta(days=1)
                conditions.append(f"created_at < ${param_num}")
                params_list.append(end_date_obj)
                param_num += 1
            
            if channel_id_list:
                placeholders = ",".join([f"${i}" for i in range(param_num, param_num + len(channel_id_list))])
                conditions.append(f"channel_id IN ({placeholders})")
                params_list.extend(channel_id_list)
                param_num += len(channel_id_list)
            
            where_sql = " AND ".join(conditions)
            
            query = f"""
                SELECT 
                    DATE(created_at)::text as date,
                    COUNT(*)::bigint as order_count,
                    COALESCE(SUM(total_amount), 0)::numeric as revenue,
                    COALESCE(AVG(total_amount), 0)::numeric as avg_ticket,
                    EXTRACT(DOW FROM created_at)::integer as day_of_week
                FROM sales
                WHERE {where_sql}
                GROUP BY DATE(created_at), EXTRACT(DOW FROM created_at)
                ORDER BY date
            """
            
            if params_list:
                results = await conn.fetch(query, *params_list)
            else:
                results = await conn.fetch(query)
            
            # Converter resultados
            trends_data = []
            for r in results:
                trends_data.append({
                    'date': str(r['date']) if r['date'] else '',
                    'order_count': int(r['order_count']) if r['order_count'] is not None else 0,
                    'revenue': float(r['revenue']) if r['revenue'] is not None else 0.0,
                    'avg_ticket': float(r['avg_ticket']) if r['avg_ticket'] is not None else 0.0,
                    'day_of_week': int(r['day_of_week']) if r['day_of_week'] is not None else 0,
                })
            
            return {"trends": trends_data}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/insights")
async def get_insights(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: asyncpg.Pool = Depends(get_db)
):
    """Gera insights automáticos baseados nos dados"""
    try:
        async with db.acquire() as conn:
            # Período atual
            current_start = start_date or '2025-05-01'
            current_end = end_date or '2025-05-31'
            
            # Converter datas
            current_start_obj = datetime.strptime(current_start, '%Y-%m-%d').date()
            current_end_obj = datetime.strptime(current_end, '%Y-%m-%d').date()
            current_end_obj = current_end_obj + timedelta(days=1)
            
            # Calcular período anterior (mesma duração)
            period_days = (current_end_obj - current_start_obj - timedelta(days=1)).days
            previous_end_obj = current_start_obj - timedelta(days=1)
            previous_start_obj = previous_end_obj - timedelta(days=period_days)
            
            insights = []
            
            # 1. Análise de Lojas - destaques positivos e negativos
            query_stores = f"""
                SELECT 
                    st.id,
                    st.name as store_name,
                    COUNT(*)::bigint as total_orders,
                    COALESCE(SUM(s.total_amount), 0)::numeric as total_revenue,
                    COALESCE(AVG(s.total_amount), 0)::numeric as avg_ticket,
                    COALESCE(AVG(s.production_seconds), 0)::numeric as avg_production_time,
                    COALESCE(AVG(s.delivery_seconds), 0)::numeric as avg_delivery_time
                FROM sales s
                JOIN stores st ON st.id = s.store_id
                WHERE s.sale_status_desc = 'COMPLETED'
                AND s.created_at >= ${1}
                AND s.created_at < ${2}
                GROUP BY st.id, st.name
            """
            stores_current = await conn.fetch(query_stores, current_start_obj, current_end_obj)
            stores_previous = await conn.fetch(query_stores, previous_start_obj, previous_end_obj)
            
            stores_current_dict = {r['id']: r for r in stores_current}
            stores_previous_dict = {r['id']: r for r in stores_previous}
            
            # Calcular médias gerais
            if stores_current:
                avg_revenue = sum(float(r['total_revenue']) for r in stores_current) / len(stores_current)
                avg_production = sum(float(r['avg_production_time']) for r in stores_current) / len(stores_current)
                avg_delivery = sum(float(r['avg_delivery_time']) for r in stores_current) / len(stores_current)
                
                # Lojas com destaques positivos (receita acima da média)
                for store in stores_current:
                    revenue = float(store['total_revenue'])
                    production = float(store['avg_production_time'])
                    delivery = float(store['avg_delivery_time'])
                    
                    # Destaque positivo em receita
                    if revenue > avg_revenue * 1.2:  # 20% acima da média
                        prev_data = stores_previous_dict.get(store['id'])
                        change = None
                        if prev_data:
                            prev_revenue = float(prev_data['total_revenue'])
                            change = ((revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
                        
                        insights.append({
                            'type': 'positive',
                            'category': 'loja_receita',
                            'title': f"🚀 {store['store_name']} está com receita acima da média",
                            'description': f"Faturamento de {formatCurrency(revenue)} está {((revenue / avg_revenue - 1) * 100):.1f}% acima da média das lojas.",
                            'change': change,
                            'data': {
                                'store_id': store['id'],
                                'store_name': store['store_name'],
                                'value': revenue,
                                'average': avg_revenue
                            }
                        })
                    
                    # Alerta negativo em tempo de preparo
                    if production > avg_production * 1.3:  # 30% acima da média
                        insights.append({
                            'type': 'warning',
                            'category': 'loja_tempo_preparo',
                            'title': f"⚠️ {store['store_name']} tem tempo de preparo elevado",
                            'description': f"Tempo médio de {formatTime(production)} está {((production / avg_production - 1) * 100):.1f}% acima da média ({formatTime(avg_production)}).",
                            'data': {
                                'store_id': store['id'],
                                'store_name': store['store_name'],
                                'value': production,
                                'average': avg_production
                            }
                        })
                    
                    # Alerta negativo em tempo de entrega
                    if delivery > avg_delivery * 1.3:  # 30% acima da média
                        insights.append({
                            'type': 'warning',
                            'category': 'loja_tempo_entrega',
                            'title': f"⚠️ {store['store_name']} tem tempo de entrega elevado",
                            'description': f"Tempo médio de {formatTime(delivery)} está {((delivery / avg_delivery - 1) * 100):.1f}% acima da média ({formatTime(avg_delivery)}).",
                            'data': {
                                'store_id': store['id'],
                                'store_name': store['store_name'],
                                'value': delivery,
                                'average': avg_delivery
                            }
                        })
            
            # 2. Análise de Produtos - mudanças relevantes
            query_products_current = f"""
                SELECT 
                    p.id,
                    p.name as product_name,
                    SUM(ps.quantity) as total_quantity,
                    COUNT(DISTINCT ps.sale_id) as order_count
                FROM product_sales ps
                JOIN sales s ON s.id = ps.sale_id
                JOIN products p ON p.id = ps.product_id
                WHERE s.sale_status_desc = 'COMPLETED'
                AND s.created_at >= ${1}
                AND s.created_at < ${2}
                GROUP BY p.id, p.name
                ORDER BY total_quantity DESC
                LIMIT 50
            """
            query_products_previous = f"""
                SELECT 
                    p.id,
                    p.name as product_name,
                    SUM(ps.quantity) as total_quantity,
                    COUNT(DISTINCT ps.sale_id) as order_count
                FROM product_sales ps
                JOIN sales s ON s.id = ps.sale_id
                JOIN products p ON p.id = ps.product_id
                WHERE s.sale_status_desc = 'COMPLETED'
                AND s.created_at >= ${1}
                AND s.created_at < ${2}
                GROUP BY p.id, p.name
            """
            products_current = await conn.fetch(query_products_current, current_start_obj, current_end_obj)
            products_previous = await conn.fetch(query_products_previous, previous_start_obj, previous_end_obj)
            
            products_current_dict = {r['id']: r for r in products_current}
            products_previous_dict = {r['id']: r for r in products_previous}
            
            # Produtos com aumento significativo
            for product in products_current:
                current_qty = float(product['total_quantity'])
                prev_data = products_previous_dict.get(product['id'])
                if prev_data:
                    prev_qty = float(prev_data['total_quantity'])
                    if prev_qty > 0:
                        change_pct = ((current_qty - prev_qty) / prev_qty * 100)
                        if change_pct > 50:  # Aumento de mais de 50%
                            insights.append({
                                'type': 'positive',
                                'category': 'produto_vendas',
                                'title': f"📈 {product['product_name']} teve aumento significativo",
                                'description': f"Quantidade vendida aumentou {change_pct:.1f}% em relação ao período anterior ({prev_qty:.0f} → {current_qty:.0f} unidades).",
                                'change': change_pct,
                                'data': {
                                    'product_id': product['id'],
                                    'product_name': product['product_name'],
                                    'current': current_qty,
                                    'previous': prev_qty
                                }
                            })
                        elif change_pct < -30:  # Queda de mais de 30%
                            insights.append({
                                'type': 'warning',
                                'category': 'produto_vendas',
                                'title': f"📉 {product['product_name']} teve queda nas vendas",
                                'description': f"Quantidade vendida caiu {abs(change_pct):.1f}% em relação ao período anterior ({prev_qty:.0f} → {current_qty:.0f} unidades).",
                                'change': change_pct,
                                'data': {
                                    'product_id': product['id'],
                                    'product_name': product['product_name'],
                                    'current': current_qty,
                                    'previous': prev_qty
                                }
                            })
            
            # 3. Produto mais vendido por dia/hora/canal (ex: quinta à noite no iFood)
            # Buscar canais para identificar iFood
            channels_query = """
                SELECT DISTINCT id, name, type
                FROM channels
                WHERE LOWER(name) LIKE '%ifood%' OR LOWER(name) LIKE '%delivery%'
                LIMIT 5
            """
            channels_list = await conn.fetch(channels_query)
            
            # Para cada dia da semana e horário noturno (18h-23h)
            for day_of_week in [4]:  # Quinta-feira (4)
                for hour in range(18, 24):  # Noite (18h-23h)
                    # Buscar produtos mais vendidos nesse dia/hora/canal
                    product_query = f"""
                        SELECT 
                            p.id,
                            p.name as product_name,
                            SUM(ps.quantity) as total_quantity,
                            SUM(ps.total_price) as total_revenue,
                            ch.name as channel_name
                        FROM product_sales ps
                        JOIN sales s ON s.id = ps.sale_id
                        JOIN products p ON p.id = ps.product_id
                        JOIN channels ch ON ch.id = s.channel_id
                        WHERE s.sale_status_desc = 'COMPLETED'
                        AND s.created_at >= ${1} AND s.created_at < ${2}
                        AND EXTRACT(DOW FROM s.created_at) = ${3}
                        AND EXTRACT(HOUR FROM s.created_at) = ${4}
                        AND (LOWER(ch.name) LIKE '%ifood%' OR LOWER(ch.name) LIKE '%delivery%' OR ch.type = 'D')
                        GROUP BY p.id, p.name, ch.name
                        ORDER BY total_quantity DESC
                        LIMIT 1
                    """
                    product_result = await conn.fetch(product_query, current_start_obj, current_end_obj, day_of_week, hour)
                    if product_result:
                        product = product_result[0]
                        days_map = {0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado'}
                        insights.append({
                            'type': 'info',
                            'category': 'produto_dia_hora',
                            'question': 'Qual produto vende mais na quinta à noite no iFood?',
                            'title': f"🍔 {product['product_name']} é o mais vendido na {days_map[day_of_week]} às {hour:02d}h no {product['channel_name']}",
                            'description': f"Quantidade vendida: {int(float(product['total_quantity']))} unidades. Receita: {formatCurrency(float(product['total_revenue']))}.",
                            'data': {
                                'product_id': product['id'],
                                'product_name': product['product_name'],
                                'day_of_week': day_of_week,
                                'hour': hour,
                                'channel_name': product['channel_name'],
                                'quantity': float(product['total_quantity']),
                                'revenue': float(product['total_revenue'])
                            }
                        })
            
            # 4. Ticket médio por canal vs loja
            # Comparar ticket médio por canal
            ticket_by_channel_query = f"""
                SELECT 
                    ch.id,
                    ch.name as channel_name,
                    COUNT(*) as order_count,
                    COALESCE(AVG(s.total_amount), 0)::numeric as avg_ticket
                FROM sales s
                JOIN channels ch ON ch.id = s.channel_id
                WHERE s.sale_status_desc = 'COMPLETED'
                AND s.created_at >= ${1} AND s.created_at < ${2}
                GROUP BY ch.id, ch.name
                ORDER BY avg_ticket DESC
            """
            ticket_by_channel = await conn.fetch(ticket_by_channel_query, current_start_obj, current_end_obj)
            ticket_by_channel_prev = await conn.fetch(ticket_by_channel_query, previous_start_obj, previous_end_obj)
            
            channel_ticket_dict = {r['id']: r for r in ticket_by_channel}
            channel_ticket_prev_dict = {r['id']: r for r in ticket_by_channel_prev}
            
            # Comparar ticket médio por loja
            ticket_by_store_query = f"""
                SELECT 
                    st.id,
                    st.name as store_name,
                    COUNT(*) as order_count,
                    COALESCE(AVG(s.total_amount), 0)::numeric as avg_ticket
                FROM sales s
                JOIN stores st ON st.id = s.store_id
                WHERE s.sale_status_desc = 'COMPLETED'
                AND s.created_at >= ${1} AND s.created_at < ${2}
                GROUP BY st.id, st.name
                ORDER BY avg_ticket DESC
            """
            ticket_by_store = await conn.fetch(ticket_by_store_query, current_start_obj, current_end_obj)
            ticket_by_store_prev = await conn.fetch(ticket_by_store_query, previous_start_obj, previous_end_obj)
            
            store_ticket_dict = {r['id']: r for r in ticket_by_store}
            store_ticket_prev_dict = {r['id']: r for r in ticket_by_store_prev}
            
            # Calcular variação média por canal
            if ticket_by_channel and ticket_by_channel_prev:
                avg_ticket_channel_current = sum(float(r['avg_ticket']) for r in ticket_by_channel) / len(ticket_by_channel)
                avg_ticket_channel_prev = sum(float(r['avg_ticket']) for r in ticket_by_channel_prev) / len(ticket_by_channel_prev)
                channel_change = ((avg_ticket_channel_current - avg_ticket_channel_prev) / avg_ticket_channel_prev * 100) if avg_ticket_channel_prev > 0 else 0
                
                # Calcular variação média por loja
                avg_ticket_store_current = sum(float(r['avg_ticket']) for r in ticket_by_store) / len(ticket_by_store)
                avg_ticket_store_prev = sum(float(r['avg_ticket']) for r in ticket_by_store_prev) / len(ticket_by_store_prev)
                store_change = ((avg_ticket_store_current - avg_ticket_store_prev) / avg_ticket_store_prev * 100) if avg_ticket_store_prev > 0 else 0
                
                if channel_change < -5 or store_change < -5:  # Queda de mais de 5%
                    if abs(channel_change) > abs(store_change):
                        insights.append({
                            'type': 'warning',
                            'category': 'ticket_medio',
                            'question': 'Meu ticket médio está caindo. É por canal ou por loja?',
                            'title': "📉 Ticket médio está caindo principalmente por canal",
                            'description': f"Variação por canal: {channel_change:.1f}%. Variação por loja: {store_change:.1f}%. A queda é mais acentuada por canal.",
                            'change': channel_change,
                            'data': {
                                'channel_change': channel_change,
                                'store_change': store_change,
                                'avg_ticket_channel': avg_ticket_channel_current,
                                'avg_ticket_store': avg_ticket_store_current
                            }
                        })
                    else:
                        insights.append({
                            'type': 'warning',
                            'category': 'ticket_medio',
                            'question': 'Meu ticket médio está caindo. É por canal ou por loja?',
                            'title': "📉 Ticket médio está caindo principalmente por loja",
                            'description': f"Variação por loja: {store_change:.1f}%. Variação por canal: {channel_change:.1f}%. A queda é mais acentuada por loja.",
                            'change': store_change,
                            'data': {
                                'channel_change': channel_change,
                                'store_change': store_change,
                                'avg_ticket_channel': avg_ticket_channel_current,
                                'avg_ticket_store': avg_ticket_store_current
                            }
                        })
            
            # 5. Tempo de entrega por dia/hora
            delivery_time_query = f"""
                SELECT 
                    EXTRACT(DOW FROM s.created_at)::integer as day_of_week,
                    EXTRACT(HOUR FROM s.created_at)::integer as hour,
                    COUNT(*) as order_count,
                    COALESCE(AVG(s.delivery_seconds), 0)::numeric as avg_delivery_time
                FROM sales s
                WHERE s.sale_status_desc = 'COMPLETED'
                AND s.created_at >= ${1} AND s.created_at < ${2}
                AND s.delivery_seconds IS NOT NULL
                GROUP BY EXTRACT(DOW FROM s.created_at), EXTRACT(HOUR FROM s.created_at)
                ORDER BY avg_delivery_time DESC
                LIMIT 10
            """
            delivery_times = await conn.fetch(delivery_time_query, current_start_obj, current_end_obj)
            delivery_times_prev = await conn.fetch(delivery_time_query, previous_start_obj, previous_end_obj)
            
            delivery_dict = {(r['day_of_week'], r['hour']): r for r in delivery_times}
            delivery_prev_dict = {(r['day_of_week'], r['hour']): r for r in delivery_times_prev}
            
            # Identificar pioras significativas
            for (dow, hour), current in delivery_dict.items():
                prev = delivery_prev_dict.get((dow, hour))
                if prev:
                    current_time = float(current['avg_delivery_time'])
                    prev_time = float(prev['avg_delivery_time'])
                    if prev_time > 0:
                        change_pct = ((current_time - prev_time) / prev_time * 100)
                        if change_pct > 20:  # Piora de mais de 20%
                            days_map = {0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado'}
                            insights.append({
                                'type': 'warning',
                                'category': 'tempo_entrega',
                                'question': 'Meu tempo de entrega piorou. Em quais dias/horários?',
                                'title': f"⏱️ Tempo de entrega piorou na {days_map[dow]} às {hour:02d}h",
                                'description': f"Tempo médio aumentou {change_pct:.1f}% ({formatTime(prev_time)} → {formatTime(current_time)}). {int(current['order_count'])} pedidos nesse período.",
                                'change': change_pct,
                                'data': {
                                    'day_of_week': dow,
                                    'hour': hour,
                                    'current_time': current_time,
                                    'previous_time': prev_time,
                                    'order_count': int(current['order_count'])
                                }
                            })
            
            # 6. Clientes com churn (3+ pedidos, não compram há 30 dias)
            churn_query = f"""
                SELECT 
                    c.id,
                    c.customer_name,
                    COUNT(DISTINCT s.id) as total_orders,
                    MAX(s.created_at)::date as last_order_date,
                    (${3}::date - MAX(s.created_at)::date)::integer as days_since_last_order
                FROM customers c
                JOIN sales s ON s.customer_id = c.id AND s.sale_status_desc = 'COMPLETED'
                WHERE c.id IS NOT NULL
                GROUP BY c.id, c.customer_name
                HAVING COUNT(DISTINCT s.id) >= 3
                AND MAX(s.created_at) < ${3}::date
                ORDER BY days_since_last_order DESC
                LIMIT 10
            """
            churn_cutoff = (current_end_obj - timedelta(days=1)) - timedelta(days=30)
            churn_customers = await conn.fetch(churn_query, current_start_obj, current_end_obj, churn_cutoff)
            
            if churn_customers:
                churn_count = len(churn_customers)
                avg_days = sum(int(r['days_since_last_order']) for r in churn_customers) / len(churn_customers)
                insights.append({
                    'type': 'warning',
                    'category': 'churn',
                    'question': 'Quais clientes compraram 3+ vezes mas não voltam há 30 dias?',
                    'title': f"👥 {churn_count} clientes com risco de churn identificados",
                    'description': f"{churn_count} clientes com 3+ pedidos não compram há 30+ dias. Tempo médio sem comprar: {avg_days:.0f} dias.",
                    'data': {
                        'churn_count': churn_count,
                        'avg_days': avg_days,
                        'customers': [
                            {
                                'id': int(r['id']),
                                'name': str(r['customer_name']),
                                'orders': int(r['total_orders']),
                                'days_since': int(r['days_since_last_order'])
                            }
                            for r in churn_customers[:5]  # Top 5
                        ]
                    }
                })
            
            # Ordenar insights por relevância
            insights.sort(key=lambda x: (
                0 if x['type'] == 'warning' else 1,  # Warnings primeiro
                -abs(x.get('change', 0)) if x.get('change') else 0  # Maiores mudanças primeiro
            ))
            
            return {"insights": insights}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


def formatCurrency(value: float) -> str:
    """Helper para formatar moeda"""
    return f"R$ {value:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')


def formatTime(seconds: float) -> str:
    """Helper para formatar tempo"""
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    if minutes == 0:
        return f"{secs}s"
    return f"{minutes}min {secs}s"


@app.get("/api/metrics/customers")
async def get_customers(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    channel_ids: Optional[str] = None,
    db: asyncpg.Pool = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Análise de clientes e seus pedidos"""
    try:
        # Parse channel_ids from comma-separated string
        channel_id_list = None
        if channel_ids:
            try:
                channel_id_list = [int(cid.strip()) for cid in channel_ids.split(',') if cid.strip()]
            except ValueError:
                channel_id_list = None
        
        async with db.acquire() as conn:
            # Converter datas
            current_start = start_date or '2025-05-01'
            current_end = end_date or '2025-05-31'
            
            current_start_obj = datetime.strptime(current_start, '%Y-%m-%d').date()
            current_end_obj = datetime.strptime(current_end, '%Y-%m-%d').date()
            current_end_obj = current_end_obj + timedelta(days=1)
            
            # Data de corte para churn (30 dias atrás do período final)
            churn_cutoff_date = (current_end_obj - timedelta(days=1)) - timedelta(days=30)
            
            # Query principal: dados dos clientes no período
            # Build WHERE clause with proper parameter numbering
            conditions = []
            params_list = []
            param_num = 1
            
            # Always add date filters
            conditions.append(f"s.created_at >= ${param_num}")
            params_list.append(current_start_obj)
            param_num += 1
            
            conditions.append(f"s.created_at < ${param_num}")
            params_list.append(current_end_obj)
            param_num += 1
            
            # Add channel filter if provided
            if channel_id_list:
                placeholders = ",".join([f"${i}" for i in range(param_num, param_num + len(channel_id_list))])
                conditions.append(f"s.channel_id IN ({placeholders})")
                params_list.extend(channel_id_list)
                param_num += len(channel_id_list)
            
            # Add store filter if user is a manager
            param_num = add_store_filter_if_needed(conditions, params_list, param_num, current_user)
            
            where_sql = " AND ".join(conditions)
            where_sql_with_status = f"s.sale_status_desc = 'COMPLETED' AND {where_sql}"
            
            # Calculate param numbers for churn and period_end (will be recalculated after customer_ids)
            
            # Simplificar a query para garantir que funcione corretamente
            # Primeiro, vamos buscar os clientes que têm pedidos no período filtrado
            period_filter_sql = f"""
                SELECT DISTINCT s.customer_id
                FROM sales s
                WHERE {where_sql_with_status}
                AND s.customer_id IS NOT NULL
            """
            period_customer_ids = await conn.fetch(period_filter_sql, *params_list)
            period_customer_id_set = {r['customer_id'] for r in period_customer_ids if r['customer_id']}
            
            if not period_customer_id_set:
                return {"customers": []}
            
            # Agora, buscar dados completos desses clientes
            customer_ids_list = list(period_customer_id_set)
            
            # Calcular os índices corretos para os parâmetros
            # all_params = params_list + customer_ids_list + [churn_cutoff_date, period_end_date]
            # Então:
            # - params_list[0] = start_date (será all_params[0])
            # - params_list[1] = end_date (será all_params[1])
            # - customer_ids começam em all_params[len(params_list)]
            # - churn e period_end vêm depois de customer_ids
            
            # Os índices na query SQL são baseados em all_params:
            date_param_1 = 1  # start_date (params_list[0] = all_params[0] = $1)
            date_param_2 = 2  # end_date (params_list[1] = all_params[1] = $2)
            customer_ids_start = len(params_list) + 1  # Primeiro customer_id
            churn_param_num = len(params_list) + len(customer_ids_list) + 1
            period_end_param_num = len(params_list) + len(customer_ids_list) + 2
            
            customer_ids_placeholder = ",".join([f"${i}" for i in range(customer_ids_start, customer_ids_start + len(customer_ids_list))])
            
            query = f"""
                WITH customer_stats AS (
                    SELECT 
                        c.id as customer_id,
                        c.customer_name,
                        c.email,
                        c.phone_number,
                        COUNT(DISTINCT s_all.id) as total_orders,
                        COALESCE(SUM(s_all.total_amount), 0)::numeric as total_spent,
                        MAX(s_all.created_at)::date as last_order_date,
                        COUNT(DISTINCT CASE WHEN s_period.id IS NOT NULL THEN s_period.id END) as orders_in_period,
                        COALESCE(SUM(CASE WHEN s_period.id IS NOT NULL THEN s_period.total_amount ELSE 0 END), 0)::numeric as spent_in_period
                    FROM customers c
                    LEFT JOIN sales s_all ON s_all.customer_id = c.id AND s_all.sale_status_desc = 'COMPLETED'
                    LEFT JOIN sales s_period ON s_period.customer_id = c.id 
                        AND s_period.sale_status_desc = 'COMPLETED'
                        AND s_period.created_at >= ${date_param_1} 
                        AND s_period.created_at < ${date_param_2}
                    WHERE c.id IN ({customer_ids_placeholder})
                    GROUP BY c.id, c.customer_name, c.email, c.phone_number
                    HAVING COUNT(DISTINCT s_all.id) > 0
                ),
                customer_days AS (
                    SELECT 
                        s.customer_id,
                        EXTRACT(DOW FROM s.created_at)::integer as dow,
                        COUNT(*) as cnt
                    FROM sales s
                    WHERE {where_sql_with_status}
                    AND s.customer_id IS NOT NULL
                    GROUP BY s.customer_id, EXTRACT(DOW FROM s.created_at)::integer
                ),
                customer_favorite_day AS (
                    SELECT 
                        customer_id,
                        dow as favorite_day_of_week,
                        ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY cnt DESC, dow) as rn
                    FROM customer_days
                ),
                customer_hours AS (
                    SELECT 
                        s.customer_id,
                        EXTRACT(HOUR FROM s.created_at)::integer as hour,
                        COUNT(*) as cnt
                    FROM sales s
                    WHERE {where_sql_with_status}
                    AND s.customer_id IS NOT NULL
                    GROUP BY s.customer_id, EXTRACT(HOUR FROM s.created_at)::integer
                ),
                customer_favorite_hour AS (
                    SELECT 
                        customer_id,
                        hour as favorite_hour,
                        ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY cnt DESC, hour) as rn
                    FROM customer_hours
                ),
                top_products_per_customer AS (
                    SELECT 
                        s.customer_id,
                        p.name as product_name,
                        SUM(ps.quantity) as quantity,
                        ROW_NUMBER() OVER (PARTITION BY s.customer_id ORDER BY SUM(ps.quantity) DESC) as rn
                    FROM sales s
                    JOIN product_sales ps ON ps.sale_id = s.id
                    JOIN products p ON p.id = ps.product_id
                    WHERE {where_sql_with_status}
                    AND s.customer_id IS NOT NULL
                    GROUP BY s.customer_id, p.name
                ),
                customer_favorite_day_filtered AS (
                    SELECT customer_id, favorite_day_of_week
                    FROM customer_favorite_day
                    WHERE rn = 1
                ),
                customer_favorite_hour_filtered AS (
                    SELECT customer_id, favorite_hour
                    FROM customer_favorite_hour
                    WHERE rn = 1
                )
                SELECT 
                    cs.*,
                    COALESCE(cfd_filtered.favorite_day_of_week, 0) as favorite_day_of_week,
                    cfh_filtered.favorite_hour,
                    tp.product_name as favorite_product,
                    tp.quantity as favorite_product_quantity,
                    CASE 
                        WHEN cs.total_orders >= 3 AND (cs.last_order_date < ${churn_param_num}::date OR cs.last_order_date IS NULL) THEN true
                        ELSE false
                    END as is_churn_risk,
                    CASE 
                        WHEN cs.last_order_date IS NOT NULL 
                        THEN (${period_end_param_num}::date - cs.last_order_date)::integer
                        ELSE NULL
                    END as days_since_last_order
                FROM customer_stats cs
                LEFT JOIN customer_favorite_day_filtered cfd_filtered ON cfd_filtered.customer_id = cs.customer_id
                LEFT JOIN customer_favorite_hour_filtered cfh_filtered ON cfh_filtered.customer_id = cs.customer_id
                LEFT JOIN top_products_per_customer tp ON tp.customer_id = cs.customer_id AND tp.rn = 1
                ORDER BY cs.spent_in_period DESC
                LIMIT 100
            """
            
            # Usar a data final do período (sem o +1 dia) para calcular dias desde último pedido
            period_end_date = current_end_obj - timedelta(days=1)
            # Combine all parameters: params_list (has dates and channels) + customer_ids + churn_cutoff_date, period_end_date
            all_params = params_list + customer_ids_list + [churn_cutoff_date, period_end_date]
            results = await conn.fetch(query, *all_params)
            
            # Converter resultados
            customers_data = []
            for r in results:
                # Mapear dia da semana
                days_map = {0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado'}
                favorite_day = days_map.get(int(r['favorite_day_of_week']) if r['favorite_day_of_week'] is not None else 0, 'N/A')
                
                # Formatar hora
                favorite_hour = int(r['favorite_hour']) if r['favorite_hour'] is not None else None
                favorite_hour_str = f"{favorite_hour:02d}:00" if favorite_hour is not None else 'N/A'
                
                customers_data.append({
                    'customer_id': int(r['customer_id']) if r['customer_id'] is not None else 0,
                    'customer_name': str(r['customer_name']) if r['customer_name'] else 'Cliente sem nome',
                    'email': str(r['email']) if r['email'] else '',
                    'phone_number': str(r['phone_number']) if r['phone_number'] else '',
                    'total_orders': int(r['total_orders']) if r['total_orders'] is not None else 0,
                    'total_spent': float(r['total_spent']) if r['total_spent'] is not None else 0.0,
                    'orders_in_period': int(r['orders_in_period']) if r['orders_in_period'] is not None else 0,
                    'spent_in_period': float(r['spent_in_period']) if r['spent_in_period'] is not None else 0.0,
                    'last_order_date': str(r['last_order_date']) if r['last_order_date'] else None,
                    'days_since_last_order': int(r['days_since_last_order']) if r['days_since_last_order'] is not None else None,
                    'favorite_day_of_week': favorite_day,
                    'favorite_hour': favorite_hour_str,
                    'favorite_product': str(r['favorite_product']) if r['favorite_product'] else 'N/A',
                    'favorite_product_quantity': float(r['favorite_product_quantity']) if r['favorite_product_quantity'] else 0.0,
                    'is_churn_risk': bool(r['is_churn_risk']) if r['is_churn_risk'] is not None else False,
                })
            
            return {"customers": customers_data}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/detailed-analysis")
async def get_detailed_analysis(
    entity_type: str,  # 'store', 'product', 'channel'
    entity_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: asyncpg.Pool = Depends(get_db)
):
    """Análise detalhada por loja, produto ou canal"""
    try:
        if entity_type not in ['store', 'product', 'channel']:
            raise HTTPException(status_code=400, detail="entity_type deve ser 'store', 'product' ou 'channel'")
        
        async with db.acquire() as conn:
            # Converter datas
            current_start = start_date or '2025-05-01'
            current_end = end_date or '2025-05-31'
            
            current_start_obj = datetime.strptime(current_start, '%Y-%m-%d').date()
            current_end_obj = datetime.strptime(current_end, '%Y-%m-%d').date()
            current_end_obj = current_end_obj + timedelta(days=1)
            
            # Build WHERE clause based on entity type
            if entity_type == 'store':
                where_condition = f"s.store_id = ${1}"
                params = [entity_id]
            elif entity_type == 'product':
                where_condition = f"ps.product_id = ${1}"
                params = [entity_id]
            else:  # channel
                where_condition = f"s.channel_id = ${1}"
                params = [entity_id]
            
            # 1. Métricas gerais (pedidos, receita, descontos)
            metrics_query = f"""
                SELECT 
                    COUNT(*)::bigint as total_orders,
                    COALESCE(SUM(s.total_amount), 0)::numeric as total_revenue,
                    COALESCE(AVG(s.total_amount), 0)::numeric as avg_ticket,
                    COALESCE(SUM(s.total_discount), 0)::numeric as total_discounts,
                    COALESCE(AVG(s.production_seconds), 0)::numeric as avg_production_time,
                    COALESCE(AVG(s.delivery_seconds), 0)::numeric as avg_delivery_time
                FROM sales s
                {'JOIN product_sales ps ON ps.sale_id = s.id' if entity_type == 'product' else ''}
                WHERE s.sale_status_desc = 'COMPLETED'
                AND {where_condition}
                AND s.created_at >= ${len(params) + 1}
                AND s.created_at < ${len(params) + 2}
            """
            
            # 2. Tendências diárias
            trends_query = f"""
                SELECT 
                    DATE(s.created_at)::text as date,
                    COUNT(*)::bigint as order_count,
                    COALESCE(SUM(s.total_amount), 0)::numeric as revenue,
                    COALESCE(AVG(s.total_amount), 0)::numeric as avg_ticket,
                    COALESCE(AVG(s.production_seconds), 0)::numeric as avg_production_time,
                    COALESCE(AVG(s.delivery_seconds), 0)::numeric as avg_delivery_time
                FROM sales s
                {'JOIN product_sales ps ON ps.sale_id = s.id' if entity_type == 'product' else ''}
                WHERE s.sale_status_desc = 'COMPLETED'
                AND {where_condition}
                AND s.created_at >= ${len(params) + 1}
                AND s.created_at < ${len(params) + 2}
                GROUP BY DATE(s.created_at)
                ORDER BY date
            """
            
            # 3. Tendências por hora
            hourly_trends_query = f"""
                SELECT 
                    EXTRACT(HOUR FROM s.created_at)::integer as hour,
                    COUNT(*)::bigint as order_count,
                    COALESCE(SUM(s.total_amount), 0)::numeric as revenue
                FROM sales s
                {'JOIN product_sales ps ON ps.sale_id = s.id' if entity_type == 'product' else ''}
                WHERE s.sale_status_desc = 'COMPLETED'
                AND {where_condition}
                AND s.created_at >= ${len(params) + 1}
                AND s.created_at < ${len(params) + 2}
                GROUP BY EXTRACT(HOUR FROM s.created_at)
                ORDER BY hour
            """
            
            # 4. Para produtos: lojas que vendem mais
            # Para lojas: produtos mais vendidos
            # Para canais: lojas mais ativas
            if entity_type == 'product':
                breakdown_query = f"""
                    SELECT 
                        st.id,
                        st.name as store_name,
                        COUNT(*)::bigint as order_count,
                        COALESCE(SUM(s.total_amount), 0)::numeric as revenue
                    FROM sales s
                    JOIN product_sales ps ON ps.sale_id = s.id
                    JOIN stores st ON st.id = s.store_id
                    WHERE s.sale_status_desc = 'COMPLETED'
                    AND ps.product_id = ${1}
                    AND s.created_at >= ${2}
                    AND s.created_at < ${3}
                    GROUP BY st.id, st.name
                    ORDER BY revenue DESC
                    LIMIT 10
                """
                breakdown_params = [entity_id, current_start_obj, current_end_obj]
            elif entity_type == 'store':
                breakdown_query = f"""
                    SELECT 
                        p.id,
                        p.name as product_name,
                        SUM(ps.quantity)::numeric as total_quantity,
                        COALESCE(SUM(ps.total_price), 0)::numeric as revenue
                    FROM sales s
                    JOIN product_sales ps ON ps.sale_id = s.id
                    JOIN products p ON p.id = ps.product_id
                    WHERE s.sale_status_desc = 'COMPLETED'
                    AND s.store_id = ${1}
                    AND s.created_at >= ${2}
                    AND s.created_at < ${3}
                    GROUP BY p.id, p.name
                    ORDER BY revenue DESC
                    LIMIT 10
                """
                breakdown_params = [entity_id, current_start_obj, current_end_obj]
            else:  # channel
                breakdown_query = f"""
                    SELECT 
                        st.id,
                        st.name as store_name,
                        COUNT(*)::bigint as order_count,
                        COALESCE(SUM(s.total_amount), 0)::numeric as revenue
                    FROM sales s
                    JOIN stores st ON st.id = s.store_id
                    WHERE s.sale_status_desc = 'COMPLETED'
                    AND s.channel_id = ${1}
                    AND s.created_at >= ${2}
                    AND s.created_at < ${3}
                    GROUP BY st.id, st.name
                    ORDER BY revenue DESC
                    LIMIT 10
                """
                breakdown_params = [entity_id, current_start_obj, current_end_obj]
            
            # Execute all queries
            all_query_params = params + [current_start_obj, current_end_obj]
            
            metrics_result = await conn.fetchrow(metrics_query, *all_query_params)
            trends_result = await conn.fetch(trends_query, *all_query_params)
            hourly_trends_result = await conn.fetch(hourly_trends_query, *all_query_params)
            breakdown_result = await conn.fetch(breakdown_query, *breakdown_params)
            
            # Format metrics
            metrics_data = {
                'total_orders': int(metrics_result['total_orders']) if metrics_result['total_orders'] else 0,
                'total_revenue': float(metrics_result['total_revenue']) if metrics_result['total_revenue'] else 0.0,
                'avg_ticket': float(metrics_result['avg_ticket']) if metrics_result['avg_ticket'] else 0.0,
                'total_discounts': float(metrics_result['total_discounts']) if metrics_result['total_discounts'] else 0.0,
                'avg_production_time': float(metrics_result['avg_production_time']) if metrics_result['avg_production_time'] else 0.0,
                'avg_delivery_time': float(metrics_result['avg_delivery_time']) if metrics_result['avg_delivery_time'] else 0.0,
            }
            
            # Format trends
            trends_data = []
            for r in trends_result:
                trends_data.append({
                    'date': str(r['date']) if r['date'] else '',
                    'order_count': int(r['order_count']) if r['order_count'] else 0,
                    'revenue': float(r['revenue']) if r['revenue'] else 0.0,
                    'avg_ticket': float(r['avg_ticket']) if r['avg_ticket'] else 0.0,
                    'avg_production_time': float(r['avg_production_time']) if r['avg_production_time'] else 0.0,
                    'avg_delivery_time': float(r['avg_delivery_time']) if r['avg_delivery_time'] else 0.0,
                })
            
            # Format hourly trends
            hourly_data = []
            for r in hourly_trends_result:
                hourly_data.append({
                    'hour': int(r['hour']) if r['hour'] is not None else 0,
                    'order_count': int(r['order_count']) if r['order_count'] else 0,
                    'revenue': float(r['revenue']) if r['revenue'] else 0.0,
                })
            
            # Format breakdown
            breakdown_data = []
            for r in breakdown_result:
                if entity_type == 'product':
                    breakdown_data.append({
                        'id': int(r['id']) if r['id'] else 0,
                        'name': str(r['store_name']) if r['store_name'] else '',
                        'order_count': int(r['order_count']) if r['order_count'] else 0,
                        'revenue': float(r['revenue']) if r['revenue'] else 0.0,
                    })
                elif entity_type == 'store':
                    breakdown_data.append({
                        'id': int(r['id']) if r['id'] else 0,
                        'name': str(r['product_name']) if r['product_name'] else '',
                        'quantity': float(r['total_quantity']) if r['total_quantity'] else 0.0,
                        'revenue': float(r['revenue']) if r['revenue'] else 0.0,
                    })
                else:  # channel
                    breakdown_data.append({
                        'id': int(r['id']) if r['id'] else 0,
                        'name': str(r['store_name']) if r['store_name'] else '',
                        'order_count': int(r['order_count']) if r['order_count'] else 0,
                        'revenue': float(r['revenue']) if r['revenue'] else 0.0,
                    })
            
            return {
                'entity_type': entity_type,
                'entity_id': entity_id,
                'metrics': metrics_data,
                'trends': trends_data,
                'hourly_trends': hourly_data,
                'breakdown': breakdown_data,
            }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

