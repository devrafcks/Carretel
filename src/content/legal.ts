/**
 * Textos legais — RASCUNHO (revisar com advogado, item D5).
 * Regra do projeto: nenhuma afirmação de artigo de lei sem citação conferida em docs/legal/fontes.md.
 * Por isso estes rascunhos descrevem só o que o produto faz, sem citar artigos.
 */
type Section = { h: string; p: string[] };
type Doc = { title: string; sections: Section[] };

export const privacy: Record<"es" | "pt-BR", Doc> = {
  "pt-BR": {
    title: "Política de privacidade",
    sections: [
      { h: "Quem somos", p: ["O Carretel é um caderno digital para talleres de costura. Os dados da empresa responsável estão no rodapé desta página."] },
      {
        h: "Que dados guardamos",
        p: [
          "Do dono do taller: e-mail de acesso, nome e dados do taller, chave Pix (se você cadastrar) e, se quiser, CPF, RNM ou CNPJ — guardados criptografados; na tela mostramos só os 3 últimos números.",
          "Da equipe e dos clientes que você cadastra: nome, WhatsApp (opcional) e os registros de produção, vales, entregas e pagamentos. Documento da equipe é opcional e também fica criptografado. Nunca guardamos foto de documento.",
          "Fotos de pacotes e entregas: comprimidas no celular e sem dados de localização (EXIF/GPS) antes do envio.",
          "Registros de acesso: data, hora, IP e navegador, inclusive quando um cliente abre ou confirma um comprovante.",
        ],
      },
      {
        h: "Para que usamos",
        p: [
          "Para o app funcionar: registrar cortes, gerar comprovantes de entrega, calcular acertos e mostrar cobranças.",
          "Para segurança e prova: os registros de acesso e de confirmação ajudam a documentar a entrega.",
          "Não vendemos dados e não usamos seus dados para publicidade.",
        ],
      },
      {
        h: "Papéis",
        p: [
          "Sobre os dados da sua equipe e dos seus clientes, o taller decide o que registrar; o Carretel guarda e processa esses dados em nome do taller.",
        ],
      },
      {
        h: "Por quanto tempo",
        p: [
          "Enquanto sua conta existir. Ao excluir a conta, apagamos os dados em até 30 dias, exceto os registros de acesso, que guardamos por 6 meses.",
          "Se a assinatura vencer, seus dados não são apagados: você continua podendo ver e exportar tudo.",
        ],
      },
      {
        h: "Seus direitos",
        p: [
          "Você pode ver, corrigir e exportar seus dados (Conta → Exportar meus dados) e excluir a conta a qualquer momento.",
          "Pessoas da equipe ou clientes podem pedir a remoção dos dados pessoais; o registro contábil fica anonimizado (por exemplo, “Trabajador #…”).",
          "Fale com o encarregado de dados pelo contato abaixo.",
        ],
      },
      {
        h: "Onde ficam os dados",
        p: ["Em provedores de nuvem (banco de dados e hospedagem). Os pagamentos da assinatura são processados pela AbacatePay; o Pix dos seus clientes vai direto para a sua chave, sem passar por nós."],
      },
    ],
  },
  es: {
    title: "Política de privacidad",
    sections: [
      { h: "Quiénes somos", p: ["Carretel es un cuaderno digital para talleres de costura. Los datos de la empresa responsable están al pie de esta página."] },
      {
        h: "Qué datos guardamos",
        p: [
          "Del dueño del taller: correo de acceso, nombre y datos del taller, llave Pix (si la registra) y, si quiere, CPF, RNM o CNPJ — guardados cifrados; en pantalla mostramos solo los 3 últimos números.",
          "Del equipo y de los clientes que usted registra: nombre, WhatsApp (opcional) y los registros de producción, adelantos, entregas y pagos. El documento del equipo es opcional y también queda cifrado. Nunca guardamos foto de documentos.",
          "Fotos de paquetes y entregas: comprimidas en el celular y sin datos de ubicación (EXIF/GPS) antes del envío.",
          "Registros de acceso: fecha, hora, IP y navegador, también cuando un cliente abre o confirma un comprobante.",
        ],
      },
      {
        h: "Para qué los usamos",
        p: [
          "Para que el app funcione: registrar cortes, generar comprobantes de entrega, calcular pagos y mostrar cobros.",
          "Para seguridad y prueba: los registros de acceso y de confirmación ayudan a documentar la entrega.",
          "No vendemos datos y no usamos sus datos para publicidad.",
        ],
      },
      {
        h: "Roles",
        p: ["Sobre los datos de su equipo y de sus clientes, el taller decide qué registrar; Carretel guarda y procesa esos datos en nombre del taller."],
      },
      {
        h: "Por cuánto tiempo",
        p: [
          "Mientras exista su cuenta. Al eliminar la cuenta, borramos los datos en hasta 30 días, excepto los registros de acceso, que guardamos por 6 meses.",
          "Si la suscripción vence, sus datos no se borran: puede seguir viendo y exportando todo.",
        ],
      },
      {
        h: "Sus derechos",
        p: [
          "Puede ver, corregir y exportar sus datos (Cuenta → Exportar mis datos) y eliminar la cuenta cuando quiera.",
          "Las personas del equipo o los clientes pueden pedir que se quiten sus datos personales; el registro contable queda anonimizado (por ejemplo, “Trabajador #…”).",
          "Hable con el encargado de datos por el contacto de abajo.",
        ],
      },
      {
        h: "Dónde quedan los datos",
        p: ["En proveedores de nube (base de datos y hosting). Los pagos de la suscripción los procesa AbacatePay; el Pix de sus clientes va directo a su llave, sin pasar por nosotros."],
      },
    ],
  },
};

export const terms: Record<"es" | "pt-BR", Doc> = {
  "pt-BR": {
    title: "Termos de uso",
    sections: [
      { h: "O serviço", p: ["O Carretel ajuda o taller a registrar cortes, comprovar entregas, fazer o acerto da equipe e cobrar. Não é emissor de nota fiscal, folha de pagamento nem marketplace, e não recebe nem guarda o dinheiro do taller."] },
      { h: "Plano e preço", p: ["Começa grátis com 3 cortes ou 30 dias (o que vier primeiro). Depois, R$ 35 por mês, por Pix Automático ou cartão. Sem fidelidade.", "Cancelamento a qualquer momento, na tela Conta, pelo mesmo meio da contratação. Nos primeiros 7 dias após a primeira cobrança, você pode cancelar e pedir o reembolso."] },
      { h: "Modo leitura", p: ["Se a assinatura vencer, a conta entra em modo leitura: você vê e exporta tudo, os links de comprovante continuam funcionando e você pode registrar pagamentos de dívidas antigas. Não sequestramos dados."] },
      { h: "Comprovantes", p: ["O comprovante de entrega é um registro eletrônico simples, com data, hora, IP e o aceite do cliente. Ele ajuda a documentar a entrega, mas não é nota fiscal e não substitui orientação jurídica."] },
      { h: "Alertas legais", p: ["Os alertas do acerto (por exemplo, piso diário) são educativos e não bloqueiam nada. Confirme sempre com seu contador ou advogado."] },
      { h: "Trabalho digno", p: ["É proibido usar o Carretel em oficinas com trabalho forçado, jornada exaustiva, servidão por dívida ou pessoas impedidas de sair. Ao detectar abuso, podemos suspender a conta e comunicar as autoridades. Denúncias pelo canal indicado abaixo."] },
      { h: "Responsabilidades", p: ["Você é responsável pelos dados que registra e por ter autorização para registrar dados de equipe e clientes."] },
    ],
  },
  es: {
    title: "Términos de uso",
    sections: [
      { h: "El servicio", p: ["Carretel ayuda al taller a registrar cortes, comprobar entregas, hacer el pago semanal del equipo y cobrar. No emite nota fiscal, no es planilla de pagos ni marketplace, y no recibe ni guarda el dinero del taller."] },
      { h: "Plan y precio", p: ["Empieza gratis con 3 cortes o 30 días (lo que llegue primero). Después, R$ 35 por mes, por Pix Automático o tarjeta. Sin fidelidad.", "Cancelación en cualquier momento, en la pantalla Cuenta, por el mismo medio de la contratación. En los primeros 7 días después del primer cobro, puede cancelar y pedir el reembolso."] },
      { h: "Modo lectura", p: ["Si la suscripción vence, la cuenta pasa a modo lectura: ve y exporta todo, los enlaces de comprobante siguen funcionando y puede registrar pagos de deudas anteriores. No secuestramos datos."] },
      { h: "Comprobantes", p: ["El comprobante de entrega es un registro electrónico simple, con fecha, hora, IP y la aceptación del cliente. Ayuda a documentar la entrega, pero no es nota fiscal y no reemplaza la orientación de un abogado."] },
      { h: "Alertas legales", p: ["Las alertas del pago semanal (por ejemplo, el piso diario) son educativas y no bloquean nada. Confirme siempre con su contador o abogado."] },
      { h: "Trabajo digno", p: ["Está prohibido usar Carretel en talleres con trabajo forzado, jornada agotadora, servidumbre por deudas o personas impedidas de salir. Si detectamos abuso, podemos suspender la cuenta y avisar a las autoridades. Denuncias por el canal indicado abajo."] },
      { h: "Responsabilidades", p: ["Usted es responsable de los datos que registra y de tener autorización para registrar datos de su equipo y de sus clientes."] },
    ],
  },
};

export const about: Record<"es" | "pt-BR", Doc> = {
  "pt-BR": {
    title: "Quem somos",
    sections: [
      { h: "Por que existe", p: ["O Carretel nasceu para o lado mais fraco da cadeia da costura: o dono do taller, que recebe o corte, paga a equipe por peça e muitas vezes leva calote. Fazemos só três coisas: registrar, comprovar e cobrar."] },
      { h: "Como pensamos", p: ["Bilíngue de verdade (espanhol e português), celular primeiro, funciona com sinal fraco, não exige CNPJ para começar e não toca no seu dinheiro."] },
    ],
  },
  es: {
    title: "Quiénes somos",
    sections: [
      { h: "Por qué existe", p: ["Carretel nació para el lado más débil de la cadena de la costura: el dueño del taller, que recibe el corte, paga al equipo por pieza y muchas veces sufre calote. Hacemos solo tres cosas: registrar, comprobar y cobrar."] },
      { h: "Cómo pensamos", p: ["Bilingüe de verdad (español y portugués), celular primero, funciona con señal débil, no exige CNPJ para empezar y no toca su dinero."] },
    ],
  },
};
