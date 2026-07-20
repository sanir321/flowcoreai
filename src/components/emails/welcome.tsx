import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  username: string;
  loginUrl: string;
}

export const WelcomeEmail = ({
  username = "there",
  loginUrl = "https://Flowter.ai/login",
}: WelcomeEmailProps) => {
  const previewText = `Welcome to Flowter, ${username}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#f9510b",
              },
            },
          },
        }}
      >
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded-xl my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <div style={{ marginBottom: '36px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>Flowter</span>
              </div>
            </Section>
            <Heading className="text-black text-[24px] font-bold p-0 my-[30px] mx-0">
              Welcome to Flowter!
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hi {username},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Your Flowter workspace is ready. Log in to connect your WhatsApp device and configure your AI agents.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-brand rounded-lg text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={loginUrl}
              >
                Go to Dashboard
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              Reply to this email if you have questions.
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Flowter Automation Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;
