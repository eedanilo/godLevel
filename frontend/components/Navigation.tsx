'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, LayoutDashboard, BarChart3, LogOut, User, Menu, X, Package, Store, Users } from 'lucide-react'
import { useState } from 'react'

// Mapeamento de roles para labels em português
const getRoleLabel = (role: string, roleLabel?: string): string => {
  if (roleLabel) return roleLabel
  
  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    owner: 'Proprietária',
    manager: 'Gerente',
  }
  
  return roleLabels[role] || role
}

export default function Navigation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, logout, isAuthenticated } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Não mostrar navegação na página de login
  if (pathname === '/login') {
    return null
  }

  // Não mostrar navegação se não estiver autenticado
  if (!isAuthenticated) {
    return null
  }

  const handleLogout = async () => {
    await logout()
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    // Para paths com query parameters, verificar se o pathname corresponde e se os query params estão corretos
    if (path.includes('?')) {
      const [basePath, queryString] = path.split('?')
      if (pathname === basePath) {
        // Verificar se os query params estão presentes na URL atual
        const expectedParams = new URLSearchParams(queryString)
        const expectedEntries = Array.from(expectedParams.entries())
        for (const [key, value] of expectedEntries) {
          if (searchParams?.get(key) !== value) {
            return false
          }
        }
        return true
      }
      return false
    }
    return pathname?.startsWith(path)
  }

  const navItems = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/explore', label: 'Explorar Dados', icon: BarChart3 },
    { href: '/dashboard?view=products', label: 'Produtos', icon: Package },
    { href: '/dashboard?view=stores', label: 'Lojas', icon: Store },
    { href: '/dashboard?view=customers', label: 'Clientes', icon: Users },
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Nome */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">God Level Analytics</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User Info and Logout */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{user.name}</span>
                    <span className="text-gray-500">({getRoleLabel(user.role, user.role_label)})</span>
                  </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              {user && (
                <>
                  <div className="px-4 py-2 border-t mt-2 pt-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{user.name}</span>
                      <span className="text-gray-500">({getRoleLabel(user.role, user.role_label)})</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

