import { FC, Fragment, useCallback } from "react";
import {
  Button,
  Container,
  Row,
  Spacer,
  useTheme,
  changeTheme,
} from "@nextui-org/react";
import { Discovery, Search, User, LightMode, DarkMode } from "../icons";
import { useIdkState } from "../idk-state";
import logoUrl from "./logo.png";

const NAV_ITEMS = [
  {
    label: "Trade",
    Icon: Discovery,
  },
  {
    label: "FAQ",
    Icon: Search,
  },
];

const Header: FC<{ isSignedIn: boolean }> = ({ isSignedIn }) => (
  <header className="header">
    <Container css={{ mw: "1248px" }}>
      <Row align="center">
        <Row align="center" className="header--logo" style={{ fontSize: 24 }}>
          <img
            src={logoUrl}
            alt="idk.finance"
            style={{ height: 36, width: "auto", marginRight: 8 }}
          />
          idk.finance
        </Row>
        {/* <nav className="header--nav">
          {NAV_ITEMS.map((item, index) => (
            <Fragment key={item.label}>
              <NavItem isActive={index === 0} item={item} />
              {index !== NAV_ITEMS.length - 1 && <Spacer x={1} />}
            </Fragment>
          ))}
        </nav> */}
        <ModeSwitcher />
        <Spacer x={1} />
        {isSignedIn && <SignOutButton />}
      </Row>
    </Container>
  </header>
);

export default Header;

type NavItemProps = {
  item: {
    Icon: FC;
    label: string;
  };
  isActive?: boolean;
};

const NavItem: FC<NavItemProps> = ({ item: { Icon, label }, isActive }) => (
  <Button light={!isActive} auto color="primary" className="button">
    <Icon />
    <Spacer x={0.5} />
    {label}
  </Button>
);

const ModeSwitcher: FC = () => {
  const { isDark } = useTheme();

  const handleChange = () => {
    changeTheme(isDark ? "light" : "dark");
  };

  const Icon = isDark ? LightMode : DarkMode;

  return (
    <Button
      onClick={handleChange}
      className="button header--mode-switcher"
      auto
      flat
    >
      <Icon />
    </Button>
  );
};

const SignOutButton: FC = () => {
  const { wallet } = useIdkState();

  const signOut = useCallback(() => wallet.signOut(), [wallet]);

  return (
    <Button
      onClick={signOut}
      className="button"
      flat
      color="secondary"
      style={{ width: 400 }}
    >
      <User />
      <Spacer x={0.5} />
      {wallet.accountId} | Sign out
    </Button>
  );
};
