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

interface ReEngagementEmailProps {
  username: string;
  loginUrl: string;
}

export const ReEngagementEmail = ({
  username = "there",
  loginUrl = "https://Flowter.ai/login",
}: ReEngagementEmailProps) => {
  const previewText = `Haven't seen you lately, ${username}`;

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
              Still there?
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hi {username},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              It&apos;s been a while since you last logged in. Your AI agents keep running, but we wanted to check in.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-brand rounded-lg text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={loginUrl}
              >
                Return to Dashboard
              </Button>
            </Section>
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

export default ReEngagementEmail;
