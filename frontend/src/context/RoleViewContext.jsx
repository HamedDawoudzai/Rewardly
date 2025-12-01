import { createContext, useState, useContext } from 'react'

const RoleViewContext = createContext(null)

export function useRoleView() {
  const context = useContext(RoleViewContext)
  if (!context) {
    throw new Error('useRoleView must be used within a RoleViewProvider')
  }
  return context
}

export function RoleViewProvider({ children }) {
  const [isRoleView, setIsRoleView] = useState(false)

  const toggleRoleView = () => setIsRoleView(prev => !prev)
  const enterRoleView = () => setIsRoleView(true)
  const exitRoleView = () => setIsRoleView(false)

  const value = {
    isRoleView,
    toggleRoleView,
    enterRoleView,
    exitRoleView
  }

  return (
    <RoleViewContext.Provider value={value}>
      {children}
    </RoleViewContext.Provider>
  )
}

export default RoleViewContext

