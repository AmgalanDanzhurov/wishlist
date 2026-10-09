import { Dashboard } from './components/Dashboard'
import { LoginScreen } from './components/LoginScreen'
import { useSession } from './hooks/useSession'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const theme = useTheme()
  const session = useSession()

  if (session === undefined) return null
  if (session === null) return <LoginScreen />

  return <Dashboard userId={session.user.id} themeMode={theme.mode} onThemeCycle={theme.cycle} />
}
