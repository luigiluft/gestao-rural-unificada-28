import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface InviteEmailProps {
  inviteUrl: string
  inviterName: string
  role: string
}

export const InviteEmail = ({
  inviteUrl,
  inviterName,
  role,
}: InviteEmailProps) => (
  <Html>
    <Head />
    <Preview>Você foi convidado para o AgroStock</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Convite para o AgroStock</Heading>
        <Text style={text}>
          Olá! Você foi convidado por <strong>{inviterName}</strong> para participar do AgroStock como <strong>{role}</strong>.
        </Text>
        <Text style={text}>
          Para aceitar o convite e criar sua conta, clique no botão abaixo:
        </Text>
        <Button
          href={inviteUrl}
          style={button}
        >
          Aceitar Convite
        </Button>
        <Text style={text}>
          Ou copie e cole este link no seu navegador:
        </Text>
        <Text style={code}>{inviteUrl}</Text>
        <Text style={footer}>
          Se você não esperava este convite, pode ignorar este email com segurança.
        </Text>
        <Text style={footer}>
          <strong>AgroHub</strong> - Gestão Rural Inteligente
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '26px',
  margin: '16px 0',
}

const button = {
  backgroundColor: '#22c55e',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  margin: '20px 0',
}

const code = {
  display: 'inline-block',
  padding: '16px 4.5%',
  width: '90.5%',
  backgroundColor: '#f4f4f4',
  borderRadius: '5px',
  border: '1px solid #eee',
  color: '#333',
  fontSize: '12px',
  wordBreak: 'break-all' as const,
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  marginBottom: '24px',
}