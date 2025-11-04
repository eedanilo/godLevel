'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { LayoutDashboard, BarChart3, TrendingUp, Package, Users, Store } from 'lucide-react'

export default function Home() {
  const { isAuthenticated } = useAuth()

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">God Level Analytics</h1>
          <p className="text-gray-600 mb-6">Faça login para acessar o sistema</p>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Analytics Customizável para Restaurantes
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore seus dados, crie dashboards personalizados e tome decisões baseadas em insights reais
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link href="/dashboard" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <LayoutDashboard className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Dashboard</h3>
            <p className="text-gray-600">
              Visualize métricas importantes de forma clara e intuitiva
            </p>
          </Link>

          <Link href="/explore" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <BarChart3 className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Explorar Dados</h3>
            <p className="text-gray-600">
              Query builder visual para criar análises personalizadas
            </p>
          </Link>

          <Link href="/dashboard?view=insights" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <TrendingUp className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Insights & Tendências</h3>
            <p className="text-gray-600">
              Descubra insights automáticos e análises inteligentes dos seus dados
            </p>
          </Link>

          <Link href="/dashboard?view=products" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <Package className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Produtos</h3>
            <p className="text-gray-600">
              Analise produtos mais vendidos, margens e performance
            </p>
          </Link>

          <Link href="/dashboard?view=customers" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <Users className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Clientes</h3>
            <p className="text-gray-600">
              Análise detalhada de clientes, preferências e identificação de churn
            </p>
          </Link>

          <Link href="/dashboard?view=stores" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <Store className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Comparar Lojas</h3>
            <p className="text-gray-600">
              Compare performance de até 5 lojas, analisando métricas e identificando diferenças
            </p>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Início Rápido</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/dashboard?view=overview"
              className="px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center font-medium"
            >
              Ver Overview do Mês
            </Link>
            <Link 
              href="/dashboard?view=products"
              className="px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center font-medium"
            >
              Top 10 Produtos Mais Vendidos
            </Link>
            <Link 
              href="/dashboard?view=stores"
              className="px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center font-medium"
            >
              Comparar Performance de Lojas
            </Link>
            <Link 
              href="/dashboard?view=customers"
              className="px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center font-medium"
            >
              Análise de Clientes
            </Link>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  )
}

