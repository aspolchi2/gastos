import { auth } from "@/auth";
import UserMenu from "./UserMenu";

const Header = async () => {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  return (
    <header className="flex shrink-0 justify-end px-4">
      {session.user.image && (
        <UserMenu
          image={session.user.image}
          name={session.user.name ?? "Usuario"}
        />
      )}
    </header>
  );
};

export default Header;
