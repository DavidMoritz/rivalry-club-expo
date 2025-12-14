import { RivalryIndex } from './RivalryIndex';

interface Game {
  id: string;
  name: string;
}

interface AuthenticatedAppProps {
  selectedGame: Game | null;
}

export function AuthenticatedApp(_props: AuthenticatedAppProps) {
  return <RivalryIndex />;
}
