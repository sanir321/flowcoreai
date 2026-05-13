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

interface EscalationAlertEmailProps {
  workspaceName: string;
  customerName: string;
  reason: string;
  inboxUrl: string;
}

export const EscalationAlertEmail = ({
  workspaceName = "Your Workspace",
  customerName = "A Customer",
  reason = "Needs human intervention",
  inboxUrl = "https://flowcore.ai/inbox",
}: EscalationAlertEmailProps) => {
  const previewText = `Escalation Alert: ${customerName} needs attention in ${workspaceName}`;

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
            <Heading className="text-black text-[24px] font-bold text-center p-0 my-[30px] mx-0">
              Escalation Alert
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello,
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              An active session in <strong>{workspaceName}</strong> has been escalated and requires your attention.
            </Text>
            <Section className="bg-[#f9f9f9] rounded-lg p-4 my-6 border border-solid border-[#eeeeee]">
              <Text className="text-[14px] leading-[24px] m-0">
                <strong>Customer:</strong> {customerName}
              </Text>
              <Text className="text-[14px] leading-[24px] m-0 mt-2">
                <strong>Reason:</strong> {reason}
              </Text>
            </Section>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-brand rounded-lg text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={inboxUrl}
              >
                Open Inbox
              </Button>
            </Section>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              You are receiving this because escalation alerts are enabled for your workspace. 
              Manage your notification settings in the <a href={`${inboxUrl}/settings`} className="text-brand no-underline">Dashboard</a>.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EscalationAlertEmail;
