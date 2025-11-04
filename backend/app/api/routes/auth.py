"""
Authentication routes (mock)
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

# Mock de usuários (em produção, isso viria de um banco de dados)
MOCK_USERS = {
    "admin@restaurante.com": {
        "id": 1,
        "email": "admin@restaurante.com",
        "name": "Administrador",
        "password": "admin123",  # Em produção, seria hash
        "role": "admin",
        "role_label": "Administrador"
    },
    "maria@restaurante.com": {
        "id": 2,
        "email": "maria@restaurante.com",
        "name": "Maria Silva",
        "password": "maria123",
        "role": "owner",
        "role_label": "Proprietária"
    },
    "gerente@restaurante.com": {
        "id": 3,
        "email": "gerente@restaurante.com",
        "name": "João Gerente",
        "password": "gerente123",
        "role": "manager",
        "role_label": "Gerente",
        "store_id": 1  # Gerente da loja ID 1
    }
}

# Mock de tokens (em produção, usar JWT)
MOCK_TOKENS = {}


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """Get current user from token (mock)"""
    if not credentials:
        return None
    
    token = credentials.credentials
    user_email = MOCK_TOKENS.get(token)
    
    if not user_email:
        return None
    
    user = MOCK_USERS.get(user_email)
    if not user:
        return None
    
    # Remover password antes de retornar
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "role_label": user.get("role_label", user["role"]),
        "store_id": user.get("store_id")  # ID da loja se for gerente
    }


@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """Mock login - aceita qualquer credencial válida"""
    user = MOCK_USERS.get(login_data.email)
    
    if not user:
        logger.warning(f"Login attempt with invalid email: {login_data.email}")
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Em um mock, aceitamos qualquer senha que corresponda ou seja "demo"
    # Para facilitar, vamos aceitar qualquer senha para usuários mock
    if login_data.password != user["password"] and login_data.password != "demo":
        logger.warning(f"Login attempt with invalid password for: {login_data.email}")
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Gerar token mock (em produção, usar JWT)
    import uuid
    token = str(uuid.uuid4())
    MOCK_TOKENS[token] = user["email"]
    
    logger.info(f"User logged in: {user['email']}")
    
    return LoginResponse(
        token=token,
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "role_label": user.get("role_label", user["role"]),
            "store_id": user.get("store_id")  # ID da loja se for gerente
        }
    )


@router.post("/logout")
async def logout(current_user: Optional[dict] = Depends(get_current_user)):
    """Mock logout - remove token"""
    if current_user:
        # Remover token (em produção, invalidar JWT)
        tokens_to_remove = [token for token, email in MOCK_TOKENS.items() if email == current_user["email"]]
        for token in tokens_to_remove:
            MOCK_TOKENS.pop(token, None)
        logger.info(f"User logged out: {current_user['email']}")
    
    return {"message": "Logout realizado com sucesso"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: Optional[dict] = Depends(get_current_user)):
    """Get current user info"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Usuário não autenticado")
    
    # Adicionar role_label se não existir
    user_dict = dict(current_user)
    user_email = MOCK_TOKENS.get(current_user.get("token", ""))
    if not user_email:
        # Tentar encontrar pelo email
        for email, user in MOCK_USERS.items():
            if user["email"] == current_user.get("email"):
                user_dict["role_label"] = user.get("role_label", user["role"])
                break
    else:
        user = MOCK_USERS.get(user_email)
        if user:
            user_dict["role_label"] = user.get("role_label", user["role"])
    
    return UserResponse(**user_dict)


@router.get("/users")
async def list_users():
    """List available mock users (for demo purposes)"""
    return {
        "users": [
            {
                "email": user["email"],
                "name": user["name"],
                "role": user["role"]
            }
            for user in MOCK_USERS.values()
        ]
    }

