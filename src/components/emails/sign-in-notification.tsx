import {
  Body,
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

interface SignInNotificationEmailProps {
  username: string;
  time: string;
  device?: string;
}

export const SignInNotificationEmail = ({
  username = "there",
  time = new Date().toLocaleString(),
  device = "Unknown Device",
}: SignInNotificationEmailProps) => {
  const previewText = `New Sign-in detected on FlowCore`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#c65f39",
              },
            },
          },
        }}
      >
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded-xl my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <div style={{ marginBottom: '36px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>flowcore</span>
              </div>
            </Section>
            <Heading className="text-black text-[24px] font-bold p-0 my-[30px] mx-0">
              New Sign-in
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hi {username},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              This is a quick notification to let you know that your account was just accessed.
            </Text>
            <Section className="bg-[#f9f9f9] rounded-lg p-4 my-6 border border-solid border-[#eeeeee]">
              <Text className="text-[14px] leading-[24px] m-0">
                <strong>Time:</strong> {time}
              </Text>
              <Text className="text-[14px] leading-[24px] m-0 mt-2">
                <strong>Device:</strong> {device}
              </Text>
            </Section>
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              If this was you, you can safely ignore this email. If you don't recognize this activity, please reset your password immediately.
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              FlowCore Security
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SignInNotificationEmail;
