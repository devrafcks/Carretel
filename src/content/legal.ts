/**
 * Textos legais — RASCUNHO (revisar com advogado, item D5).
 * Regra do projeto: nenhuma afirmação de artigo de lei sem citação conferida em docs/legal/fontes.md.
 * Por isso estes rascunhos descrevem só o que o produto faz, em linguagem simples, sem citar artigos.
 */
import { brand } from "@/config/brand";
import { annualPriceCents } from "@/lib/pricing";

// preços vêm do config (src/config/brand.ts → pricing) para os termos nunca ficarem desatualizados
const P = brand.pricing;
const reais = (c: number) => "R$ " + (c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2).replace(".", ","));
const FOUNDER = reais(P.founderMonthlyCents);
const STANDARD = reais(P.standardMonthlyCents);
const ANNUAL_FOUNDER = reais(annualPriceCents("founder", P));
const ANNUAL = reais(annualPriceCents("standard", P));
const OFF = P.annualDiscountPct;

export type LegalSection = { h: string; p: string[]; list?: string[] };
export type LegalDoc = { title: string; lead: string; summary?: string[]; sections: LegalSection[] };

export const privacy: Record<"es" | "pt-BR", LegalDoc> = {
  "pt-BR": {
    title: "Política de privacidade",
    lead: "Como o Carretel cuida dos dados do seu taller, da sua equipe e dos seus clientes. Escrita em linguagem simples, sem letra miúda.",
    summary: [
      "Guardamos só o necessário para o app funcionar: cortes, entregas, acertos e cobranças.",
      "Não vendemos dados e não usamos nada para publicidade.",
      "Documentos (CPF, RNM, CNPJ) ficam criptografados; na tela aparecem só os 3 últimos números.",
      "Você exporta tudo quando quiser e pode excluir a conta a qualquer momento.",
    ],
    sections: [
      {
        h: "Quem somos",
        p: ["O Carretel é um caderno digital para talleres de costura: registra cortes, comprova entregas, faz o acerto da equipe e ajuda a cobrar. Os dados da empresa responsável e o contato do encarregado de dados estão no fim desta página."],
      },
      {
        h: "Que dados guardamos",
        p: ["Só o que você mesmo registra no app, mais o mínimo técnico para manter tudo seguro:"],
        list: [
          "Da sua conta: e-mail, senha (guardada de forma irreversível, nem nós conseguimos ler) e o idioma escolhido.",
          "Do taller: nome, bairro, cidade, número de máquinas, chave Pix (se você cadastrar) e, se quiser, CPF, RNM ou CNPJ.",
          "Da equipe e dos clientes que você cadastra: nome, WhatsApp (opcional) e os registros de produção, vales, entregas e pagamentos.",
          "Fotos de pacotes e entregas: comprimidas no próprio celular e sem dados de localização (EXIF/GPS) antes do envio.",
          "Registros de acesso: data, hora, IP e navegador, inclusive quando um cliente abre ou confirma um comprovante.",
        ],
      },
      {
        h: "O que nunca guardamos",
        p: [],
        list: [
          "Foto de documento de identidade.",
          "Dados do cartão de crédito: o pagamento da assinatura é feito direto no provedor de pagamentos.",
          "Sua localização em tempo real ou seus contatos do celular.",
        ],
      },
      {
        h: "Para que usamos",
        p: [],
        list: [
          "Para o app funcionar: registrar cortes, gerar comprovantes, calcular o acerto do sábado e mostrar quem te deve.",
          "Para comprovar entregas: os registros de acesso e de confirmação documentam que o cliente recebeu.",
          "Para segurança: evitar acessos indevidos, abuso e fraude.",
          "Para cobrar a assinatura e avisar sobre vencimentos.",
        ],
      },
      {
        h: "Com quem compartilhamos",
        p: [
          "Não vendemos nem alugamos dados. Usamos alguns fornecedores só para o serviço funcionar: provedor de banco de dados e de hospedagem em nuvem, e o provedor de pagamentos da assinatura (AbacatePay).",
          "O Pix que seus clientes pagam vai direto para a sua chave, sem passar pelo Carretel.",
          "Quando você envia uma cobrança ou um comprovante pelo WhatsApp, é você quem envia, do seu celular.",
        ],
      },
      {
        h: "Quem decide sobre os dados da equipe e dos clientes",
        p: ["O taller decide o que registrar sobre a própria equipe e os próprios clientes. O Carretel guarda e processa esses dados em nome do taller, apenas para as funções do app."],
      },
      {
        h: "Segurança",
        p: [],
        list: [
          "Conexão sempre criptografada (HTTPS).",
          "Documentos pessoais criptografados no banco de dados.",
          "Cada taller só enxerga os próprios dados; o isolamento é verificado no servidor em toda operação.",
          "Comprovantes confirmados e acertos pagos não podem ser alterados depois, para valerem como registro.",
        ],
      },
      {
        h: "Cookies e armazenamento no celular",
        p: [
          "Usamos só cookies necessários para manter você conectado. Guardamos no próprio aparelho o idioma, o tema e os registros feitos sem sinal, até sincronizar.",
          "O site carrega uma ferramenta de acessibilidade de terceiros, que pode guardar as preferências de leitura que você escolher nela. Não usamos cookies de publicidade.",
        ],
      },
      {
        h: "Por quanto tempo guardamos",
        p: [
          "Enquanto sua conta existir. Se você excluir a conta, apagamos os dados em até 30 dias, exceto os registros de acesso, que guardamos por 6 meses.",
          "Se a assinatura vencer, nada é apagado: a conta entra em modo leitura e você continua vendo e exportando tudo.",
        ],
      },
      {
        h: "Seus direitos",
        p: [],
        list: [
          "Ver e corrigir seus dados a qualquer momento, na tela Conta.",
          "Exportar tudo em planilha (Conta → Exportar meus dados).",
          "Excluir a conta quando quiser.",
          "Pessoas da equipe ou clientes podem pedir a remoção dos dados pessoais; o registro contábil fica anonimizado (por exemplo, “Trabalhador #…”).",
          "Tirar dúvidas ou fazer pedidos pelo contato do encarregado de dados, no fim desta página.",
        ],
      },
      {
        h: "Idade mínima",
        p: ["O Carretel é para quem toca um taller e tem 18 anos ou mais."],
      },
      {
        h: "Mudanças nesta política",
        p: ["Se mudarmos algo importante, avisamos dentro do app antes de a mudança valer. A versão e a data ficam sempre no topo desta página."],
      },
    ],
  },
  es: {
    title: "Política de privacidad",
    lead: "Cómo Carretel cuida los datos de su taller, de su equipo y de sus clientes. En lenguaje simple, sin letra chica.",
    summary: [
      "Guardamos solo lo necesario para que el app funcione: cortes, entregas, pagos al equipo y cobros.",
      "No vendemos datos y no usamos nada para publicidad.",
      "Los documentos (CPF, RNM, CNPJ) quedan cifrados; en pantalla se ven solo los 3 últimos números.",
      "Puede exportar todo cuando quiera y eliminar la cuenta en cualquier momento.",
    ],
    sections: [
      {
        h: "Quiénes somos",
        p: ["Carretel es un cuaderno digital para talleres de costura: registra cortes, comprueba entregas, hace el pago del equipo y ayuda a cobrar. Los datos de la empresa responsable y el contacto del encargado de datos están al final de esta página."],
      },
      {
        h: "Qué datos guardamos",
        p: ["Solo lo que usted mismo registra en el app, más lo mínimo técnico para mantener todo seguro:"],
        list: [
          "De su cuenta: correo, contraseña (guardada de forma irreversible, ni nosotros podemos leerla) y el idioma elegido.",
          "Del taller: nombre, barrio, ciudad, cantidad de máquinas, llave Pix (si la registra) y, si quiere, CPF, RNM o CNPJ.",
          "Del equipo y de los clientes que registra: nombre, WhatsApp (opcional) y los registros de producción, adelantos, entregas y pagos.",
          "Fotos de paquetes y entregas: comprimidas en el mismo celular y sin datos de ubicación (EXIF/GPS) antes del envío.",
          "Registros de acceso: fecha, hora, IP y navegador, también cuando un cliente abre o confirma un comprobante.",
        ],
      },
      {
        h: "Lo que nunca guardamos",
        p: [],
        list: [
          "Fotos de documentos de identidad.",
          "Datos de tarjeta de crédito: el pago de la suscripción se hace directo en el proveedor de pagos.",
          "Su ubicación en tiempo real o los contactos de su celular.",
        ],
      },
      {
        h: "Para qué los usamos",
        p: [],
        list: [
          "Para que el app funcione: registrar cortes, generar comprobantes, calcular el pago del sábado y mostrar quién le debe.",
          "Para comprobar entregas: los registros de acceso y de confirmación documentan que el cliente recibió.",
          "Para seguridad: evitar accesos indebidos, abuso y fraude.",
          "Para cobrar la suscripción y avisar sobre vencimientos.",
        ],
      },
      {
        h: "Con quién compartimos",
        p: [
          "No vendemos ni alquilamos datos. Usamos algunos proveedores solo para que el servicio funcione: base de datos y hosting en la nube, y el proveedor de pagos de la suscripción (AbacatePay).",
          "El Pix que pagan sus clientes va directo a su llave, sin pasar por Carretel.",
          "Cuando envía un cobro o un comprobante por WhatsApp, lo envía usted, desde su celular.",
        ],
      },
      {
        h: "Quién decide sobre los datos del equipo y de los clientes",
        p: ["El taller decide qué registrar sobre su propio equipo y sus propios clientes. Carretel guarda y procesa esos datos en nombre del taller, solo para las funciones del app."],
      },
      {
        h: "Seguridad",
        p: [],
        list: [
          "Conexión siempre cifrada (HTTPS).",
          "Documentos personales cifrados en la base de datos.",
          "Cada taller ve solo sus propios datos; el aislamiento se verifica en el servidor en cada operación.",
          "Los comprobantes confirmados y los pagos cerrados no se pueden cambiar después, para que valgan como registro.",
        ],
      },
      {
        h: "Cookies y almacenamiento en el celular",
        p: [
          "Usamos solo cookies necesarias para mantener su sesión. Guardamos en el mismo aparato el idioma, el tema y los registros hechos sin señal, hasta sincronizar.",
          "El sitio carga una herramienta de accesibilidad de terceros, que puede guardar las preferencias de lectura que usted elija en ella. No usamos cookies de publicidad.",
        ],
      },
      {
        h: "Por cuánto tiempo guardamos",
        p: [
          "Mientras exista su cuenta. Si elimina la cuenta, borramos los datos en hasta 30 días, excepto los registros de acceso, que guardamos por 6 meses.",
          "Si la suscripción vence, no se borra nada: la cuenta pasa a modo lectura y puede seguir viendo y exportando todo.",
        ],
      },
      {
        h: "Sus derechos",
        p: [],
        list: [
          "Ver y corregir sus datos en cualquier momento, en la pantalla Cuenta.",
          "Exportar todo en planilla (Cuenta → Exportar mis datos).",
          "Eliminar la cuenta cuando quiera.",
          "Las personas del equipo o los clientes pueden pedir que se quiten sus datos personales; el registro contable queda anonimizado (por ejemplo, “Trabajador #…”).",
          "Hacer consultas o pedidos por el contacto del encargado de datos, al final de esta página.",
        ],
      },
      {
        h: "Edad mínima",
        p: ["Carretel es para quien lleva un taller y tiene 18 años o más."],
      },
      {
        h: "Cambios en esta política",
        p: ["Si cambiamos algo importante, avisamos dentro del app antes de que el cambio valga. La versión y la fecha quedan siempre arriba en esta página."],
      },
    ],
  },
};

export const terms: Record<"es" | "pt-BR", LegalDoc> = {
  "pt-BR": {
    title: "Termos de uso",
    lead: "As regras do jogo entre o Carretel e o seu taller. Curtas, diretas e sem pegadinha.",
    summary: [
      `Começa grátis. Depois, ${FOUNDER} por mês para as ${P.founderSpots} primeiras oficinas (preço travado enquanto a assinatura estiver ativa) e ${STANDARD} por mês para as seguintes. No anual, ${OFF}% de desconto. Sem fidelidade.`,
      "Cancele quando quiser, na tela Conta. Nos primeiros 7 dias após a primeira cobrança, devolvemos o valor.",
      "Se a assinatura vencer, seus dados continuam seus: modo leitura, com exportação liberada.",
      "O Carretel não emite nota fiscal e não toca no seu dinheiro.",
    ],
    sections: [
      {
        h: "O serviço",
        p: ["O Carretel ajuda o taller a registrar cortes, comprovar entregas, fazer o acerto da equipe e cobrar. Não é emissor de nota fiscal, folha de pagamento nem marketplace, e não recebe nem guarda o dinheiro do taller."],
      },
      {
        h: "Sua conta",
        p: [
          "Você entra com e-mail e senha. Guarde sua senha com cuidado e não compartilhe; o que for feito com a sua conta é de sua responsabilidade.",
          "Os dados informados no cadastro do taller precisam ser verdadeiros. Você pode corrigi-los a qualquer momento na tela Conta.",
        ],
      },
      {
        h: "Plano e preço",
        p: [
          "Começa grátis com 3 cortes ou 30 dias, o que vier primeiro. Sem fidelidade e sem taxa de cancelamento.",
          `Plano mensal: ${FOUNDER} por mês para as ${P.founderSpots} primeiras oficinas que assinam (preço de fundador) e ${STANDARD} por mês para as seguintes, por Pix Automático ou cartão. A faixa é definida no momento da assinatura.`,
          `Preço de fundador travado enquanto a assinatura estiver ativa: nas renovações você continua pagando ${FOUNDER} por mês. Se cancelar e assinar de novo depois, vale o preço do momento da nova assinatura. Com a assinatura ativa, o preço do seu plano nunca sobe na renovação.`,
          `Plano anual: 12 mensalidades com ${OFF}% de desconto (${ANNUAL_FOUNDER} por ano no preço de fundador, ${ANNUAL} por ano no preço padrão), em pagamento único por Pix ou cartão (em até ${P.annualMaxInstallments}x). Não renova sozinho: nos últimos ${P.annualRenewWindowDays} dias você pode renovar por mais 12 meses, no mesmo preço.`,
        ],
      },
      {
        h: "Cancelamento e reembolso",
        p: [
          "Você cancela a qualquer momento, na tela Conta, pelo mesmo meio usado na contratação. O acesso completo continua até o fim do período já pago.",
          "Nos primeiros 7 dias após a primeira cobrança, você pode cancelar e pedir o reembolso integral.",
        ],
      },
      {
        h: "Modo leitura",
        p: ["Se a assinatura vencer, a conta entra em modo leitura: você vê e exporta tudo, os links de comprovante continuam funcionando e você ainda registra pagamentos de dívidas antigas. Seus dados nunca ficam presos."],
      },
      {
        h: "Comprovantes de entrega",
        p: ["O comprovante é um registro eletrônico simples, com data, hora, IP e o aceite do cliente. Ele ajuda a documentar a entrega, mas não é nota fiscal e não substitui a orientação de um advogado."],
      },
      {
        h: "Calculadora e alertas",
        p: ["A calculadora de preço e os alertas do acerto (por exemplo, piso diário) são estimativas educativas, feitas com os números que você informa. Eles não bloqueiam nada. Para decisões importantes, confirme com seu contador ou advogado."],
      },
      {
        h: "Uso aceitável",
        p: ["Não é permitido usar o Carretel para fraudes, para registrar dados de pessoas sem necessidade ou em oficinas com trabalho forçado, jornada exaustiva, servidão por dívida ou pessoas impedidas de sair. Nesses casos podemos suspender a conta e comunicar as autoridades. Denúncias pelo canal indicado no fim da página."],
      },
      {
        h: "Funcionamento sem sinal",
        p: ["O app guarda registros no celular quando não há internet e sincroniza quando o sinal volta. Fazemos o possível para o serviço ficar sempre no ar, mas podem acontecer pausas para manutenção ou falhas de terceiros (internet, provedores de nuvem)."],
      },
      {
        h: "Responsabilidades",
        p: ["Você é responsável pelos dados que registra e por ter autorização para registrar dados da sua equipe e dos seus clientes. O Carretel responde pelo funcionamento do app nos limites destes termos e da lei."],
      },
      {
        h: "Mudanças nestes termos",
        p: ["Se mudarmos algo importante, avisamos dentro do app antes de a mudança valer. Se não concordar, você pode cancelar sem custo."],
      },
    ],
  },
  es: {
    title: "Términos de uso",
    lead: "Las reglas entre Carretel y su taller. Cortas, directas y sin trampas.",
    summary: [
      `Empieza gratis. Después, ${FOUNDER} por mes para los ${P.founderSpots} primeros talleres (precio fijo mientras la suscripción esté activa) y ${STANDARD} por mes para los siguientes. En el anual, ${OFF}% de descuento. Sin fidelidad.`,
      "Cancele cuando quiera, en la pantalla Cuenta. En los primeros 7 días después del primer cobro, devolvemos el valor.",
      "Si la suscripción vence, sus datos siguen siendo suyos: modo lectura, con exportación libre.",
      "Carretel no emite nota fiscal y no toca su dinero.",
    ],
    sections: [
      {
        h: "El servicio",
        p: ["Carretel ayuda al taller a registrar cortes, comprobar entregas, hacer el pago del equipo y cobrar. No emite nota fiscal, no es planilla de pagos ni marketplace, y no recibe ni guarda el dinero del taller."],
      },
      {
        h: "Su cuenta",
        p: [
          "Entra con correo y contraseña. Cuide su contraseña y no la comparta; lo que se haga con su cuenta es su responsabilidad.",
          "Los datos del registro del taller tienen que ser verdaderos. Puede corregirlos en cualquier momento en la pantalla Cuenta.",
        ],
      },
      {
        h: "Plan y precio",
        p: [
          "Empieza gratis con 3 cortes o 30 días, lo que llegue primero. Sin fidelidad y sin multa por cancelar.",
          `Plan mensual: ${FOUNDER} por mes para los ${P.founderSpots} primeros talleres que se suscriben (precio de fundador) y ${STANDARD} por mes para los siguientes, por Pix Automático o tarjeta. El precio se define al momento de suscribirse.`,
          `Precio de fundador fijo mientras la suscripción esté activa: en las renovaciones sigue pagando ${FOUNDER} por mes. Si cancela y vuelve a suscribirse después, vale el precio del momento de la nueva suscripción. Con la suscripción activa, el precio de su plan nunca sube al renovar.`,
          `Plan anual: 12 mensualidades con ${OFF}% de descuento (${ANNUAL_FOUNDER} por año con precio de fundador, ${ANNUAL} por año con precio normal), en pago único por Pix o tarjeta (hasta ${P.annualMaxInstallments} cuotas). No se renueva solo: en los últimos ${P.annualRenewWindowDays} días puede renovar por 12 meses más, al mismo precio.`,
        ],
      },
      {
        h: "Cancelación y reembolso",
        p: [
          "Cancela en cualquier momento, en la pantalla Cuenta, por el mismo medio de la contratación. El acceso completo sigue hasta el final del período ya pagado.",
          "En los primeros 7 días después del primer cobro, puede cancelar y pedir el reembolso total.",
        ],
      },
      {
        h: "Modo lectura",
        p: ["Si la suscripción vence, la cuenta pasa a modo lectura: ve y exporta todo, los enlaces de comprobante siguen funcionando y todavía puede registrar pagos de deudas anteriores. Sus datos nunca quedan presos."],
      },
      {
        h: "Comprobantes de entrega",
        p: ["El comprobante es un registro electrónico simple, con fecha, hora, IP y la aceptación del cliente. Ayuda a documentar la entrega, pero no es nota fiscal y no reemplaza la orientación de un abogado."],
      },
      {
        h: "Calculadora y alertas",
        p: ["La calculadora de precio y las alertas del pago semanal (por ejemplo, el piso diario) son estimaciones educativas, hechas con los números que usted informa. No bloquean nada. Para decisiones importantes, confirme con su contador o abogado."],
      },
      {
        h: "Uso aceptable",
        p: ["No está permitido usar Carretel para fraudes, para registrar datos de personas sin necesidad o en talleres con trabajo forzado, jornada agotadora, servidumbre por deudas o personas impedidas de salir. En esos casos podemos suspender la cuenta y avisar a las autoridades. Denuncias por el canal indicado al final de la página."],
      },
      {
        h: "Funcionamiento sin señal",
        p: ["El app guarda los registros en el celular cuando no hay internet y sincroniza cuando vuelve la señal. Hacemos lo posible para que el servicio esté siempre en línea, pero puede haber pausas por mantenimiento o fallas de terceros (internet, proveedores de nube)."],
      },
      {
        h: "Responsabilidades",
        p: ["Usted es responsable de los datos que registra y de tener autorización para registrar datos de su equipo y de sus clientes. Carretel responde por el funcionamiento del app dentro de estos términos y de la ley."],
      },
      {
        h: "Cambios en estos términos",
        p: ["Si cambiamos algo importante, avisamos dentro del app antes de que el cambio valga. Si no está de acuerdo, puede cancelar sin costo."],
      },
    ],
  },
};

export const about: Record<"es" | "pt-BR", LegalDoc> = {
  "pt-BR": {
    title: "Quem somos",
    lead: "Um caderno digital feito para quem toca o taller.",
    sections: [
      { h: "Por que existe", p: ["O Carretel nasceu para o lado mais fraco da cadeia da costura: o dono do taller, que recebe o corte, paga a equipe por peça e muitas vezes leva calote. Fazemos só três coisas: registrar, comprovar e cobrar."] },
      { h: "Como pensamos", p: ["Bilíngue de verdade (espanhol e português), celular primeiro, funciona com sinal fraco, não exige CNPJ para começar e não toca no seu dinheiro."] },
    ],
  },
  es: {
    title: "Quiénes somos",
    lead: "Un cuaderno digital hecho para quien lleva el taller.",
    sections: [
      { h: "Por qué existe", p: ["Carretel nació para el lado más débil de la cadena de la costura: el dueño del taller, que recibe el corte, paga al equipo por pieza y muchas veces sufre calote. Hacemos solo tres cosas: registrar, comprobar y cobrar."] },
      { h: "Cómo pensamos", p: ["Bilingüe de verdad (español y portugués), celular primero, funciona con señal débil, no exige CNPJ para empezar y no toca su dinero."] },
    ],
  },
};
