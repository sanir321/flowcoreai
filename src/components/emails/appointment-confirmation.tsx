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

interface AppointmentConfirmationEmailProps {
  customerName: string;
  workspaceName: string;
  service: string;
  date: string;
  meetLink?: string;
}

export const AppointmentConfirmationEmail = ({
  customerName = "there",
  workspaceName = "FlowCore",
  service = "Consultation",
  date = new Date().toLocaleString(),
  meetLink,
}: AppointmentConfirmationEmailProps) => {
  const previewText = `Appointment Confirmed with ${workspaceName}`;

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
              Appointment Confirmed
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hi {customerName},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Your appointment with <strong>{workspaceName}</strong> has been confirmed.
            </Text>
            <Section className="bg-[#f9f9f9] rounded-lg p-4 my-6 border border-solid border-[#eeeeee]">
              <Text className="text-[14px] leading-[24px] m-0">
                <strong>Service:</strong> {service}
              </Text>
              <Text className="text-[14px] leading-[24px] m-0 mt-2">
                <strong>Date:</strong> {date}
              </Text>
              {meetLink && (
                <Text className="text-[14px] leading-[24px] m-0 mt-2">
                  <strong>Meeting Link:</strong>{' '}
                  <a href={meetLink} className="text-brand no-underline">{meetLink}</a>
                </Text>
              )}
            </Section>
            {meetLink && (
              <Section className="text-center mt-[32px] mb-[32px]">
                <a
                  href={meetLink}
                  className="bg-brand rounded-lg text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                  style={{ display: 'inline-block' }}
                >
                  Join Google Meet
                </a>
              </Section>
            )}
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              If you need to reschedule or cancel, please contact {workspaceName} directly.
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              {workspaceName} — Powered by FlowCore AI
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default AppointmentConfirmationEmail;
