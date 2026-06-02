import { auth } from "@/auth";
import UserMenu from "./UserMenu";

const Header = async () => {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  return (
    <header className="w-full flex items-end justify-end flex-col pb-4">
      {session.user.image && (
        <UserMenu
          image={session.user.image}
          name={session.user.name ?? "Usuario"}
        />
      )}
      <hr className="w-full border-gray-700 mt-4" />
    </header>
  );
};

export default Header;
