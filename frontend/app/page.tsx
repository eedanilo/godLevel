'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { LayoutDashboard, BarChart3, TrendingUp, Package, Users, Store, LogIn, ArrowRight, Sparkles } from 'lucide-react'

export default function Home() {
  const { isAuthenticated } = useAuth()

  // Se não estiver autenticado, mostrar landing page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-4xl w-full relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl shadow-2xl mb-6 transform hover:scale-105 transition-transform">
              <BarChart3 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              God Level Analytics
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-2 font-medium">
              Analytics personalizado para restaurantes
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transforme seus dados em insights acionáveis e tome decisões baseadas em informações reais
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/60 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboards Inteligentes</h3>
              <p className="text-sm text-gray-600">
                Visualize métricas importantes de forma clara e intuitiva
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Análise Avançada</h3>
              <p className="text-sm text-gray-600">
                Explore dados com ferramentas poderosas de análise
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Insights Automáticos</h3>
              <p className="text-sm text-gray-600">
                Descubra padrões e tendências automaticamente
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Pronto para começar?
              </h2>
              <p className="text-gray-600">
                Faça login para acessar todas as funcionalidades do sistema
              </p>
            </div>
            <Link
              href="/login"
              className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Fazer Login
              <ArrowRight className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Powered by <span className="font-semibold text-blue-600">God Level</span> Analytics
          </p>
        </div>

        <style jsx>{`
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
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
      </main>
    </div>
    </ProtectedRoute>
  )
}

