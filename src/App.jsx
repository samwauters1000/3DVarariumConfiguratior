import Configurator from './components/configurator/Configurator.jsx'
import { ConfiguratorProvider } from './hooks/useConfigurator.jsx'
import { SceneApiProvider } from './hooks/useSceneApi.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'

export default function App() {
  return (
    <AuthProvider>
      <ConfiguratorProvider>
        <SceneApiProvider>
          <Configurator />
        </SceneApiProvider>
      </ConfiguratorProvider>
    </AuthProvider>
  )
}
