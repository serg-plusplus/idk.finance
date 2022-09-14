import React from "react";
import {
  Container,
  Button,
  Text,
  Link,
  Spacer,
  Modal,
  Row,
  Col,
  Checkbox,
} from "@nextui-org/react";
import { Discovery, ChevronRight, Search } from "./icons";

export function SignInPrompt({ onClick }) {
  const [visible, setVisible] = React.useState(false);
  const [selectedCheckbox, setSelectedCheckbox] = React.useState({
    first: false,
    second: false,
    third: false,
  });
  const handler = () => setVisible(true);

  const closeHandler = () => {
    setVisible(false);
  };

  return (
    <>
      <main>
        <Container
          display="flex"
          direction="column"
          alignItems="center"
          className="sign-in--container"
          sm
        >
          <Text
            h1
            css={{
              textGradient: "45deg, $blue600 -20%, $pink600 50%",
            }}
            weight="bold"
          >
            Decentralized Betting Protocol
          </Text>
          <Spacer y={0.5} />
          <Text size="$2xl">
            <Link href="/" css={{ display: "inline" }}>
              idk.finance
            </Link>{" "}
            is an automated prediction market platform for tracking of and
            betting on future real-world events driven by oracles and market
            incentives.
          </Text>
          <Spacer y={3} />
          <Row justify="center">
            <Button
              onClick={handler}
              color="gradient"
              className="button"
              size="lg"
            >
              <Discovery />
              <Spacer x={0.5} />
              Launch idk.finance
            </Button>
            {/* <Spacer x={1} />
            <Button flat color="primary" className="button">
              <Search />
              <Spacer x={0.5} />
              Learn more
            </Button> */}
          </Row>
        </Container>
      </main>
      <Modal
        closeButton
        aria-labelledby="modal-title"
        open={visible}
        onClose={closeHandler}
      >
        <Modal.Header>
          <Col>
            <Text id="modal-title" size={18}>
              Welcome to{" "}
              <Text
                b
                size={18}
                css={{
                  textGradient: "45deg, $blue600 -20%, $pink600 50%",
                }}
              >
                idk.finance
              </Text>
            </Text>
            <Text size={18}>This Product is in beta.</Text>
          </Col>
        </Modal.Header>
        <Modal.Body>
          <Text>
            Once you enter a position, you cannot cancel or adjust it.
          </Text>
          <Checkbox
            isSelected={selectedCheckbox.first}
            onChange={() =>
              setSelectedCheckbox((prevState) => ({
                ...prevState,
                first: !prevState.first,
              }))
            }
          >
            <Text size={14}>I am over 21 years old.</Text>
          </Checkbox>
          <Checkbox
            isSelected={selectedCheckbox.second}
            onChange={() =>
              setSelectedCheckbox((prevState) => ({
                ...prevState,
                second: !prevState.second,
              }))
            }
          >
            <Text size={14}>
              I understand that I am using this product at my own risk. Any
              losses incurred due to my actions are my own responsibility.
            </Text>
          </Checkbox>
          <Checkbox
            isSelected={selectedCheckbox.third}
            onChange={() =>
              setSelectedCheckbox((prevState) => ({
                ...prevState,
                third: !prevState.third,
              }))
            }
          >
            <Text size={14}>
              I understand that this product is still in beta. I am
              participating at my own risk.
            </Text>
          </Checkbox>
        </Modal.Body>
        <Modal.Footer>
          <Row justify="center">
            <Button
              disabled={
                Object.values(selectedCheckbox).filter((item) => !item)
                  .length >= 1
              }
              onClick={() => {
                closeHandler();
                onClick();
              }}
              className="button"
            >
              Continue
              <Spacer x={0.5} />
              <ChevronRight />
            </Button>
          </Row>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export function SignOutButton({ accountId, onClick }) {
  return (
    <button style={{ float: "right" }} onClick={onClick}>
      Sign out {accountId}
    </button>
  );
}

export function EducationalText() {
  return (
    <>
      <p>
        Look at that! A Hello World app! This greeting is stored on the NEAR
        blockchain. Check it out:
      </p>
      <ol>
        <li>
          Look in <code>frontend/App.js</code> - you'll see{" "}
          <code>getGreeting</code> and <code>setGreeting</code> being called on{" "}
          <code>contract</code>. What's this?
        </li>
        <li>
          Ultimately, this <code>contract</code> code is defined in{" "}
          <code>./contract</code> – this is the source code for your{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://docs.near.org/docs/develop/contracts/overview"
          >
            smart contract
          </a>
          .
        </li>
        <li>
          When you run <code>npm run deploy</code>, the code in{" "}
          <code>./contract</code> gets deployed to the NEAR testnet. You can see
          how this happens by looking in <code>package.json</code>.
        </li>
      </ol>
      <hr />
      <p>
        To keep learning, check out{" "}
        <a target="_blank" rel="noreferrer" href="https://docs.near.org">
          the NEAR docs
        </a>{" "}
        or look through some{" "}
        <a target="_blank" rel="noreferrer" href="https://examples.near.org">
          example apps
        </a>
        .
      </p>
    </>
  );
}
