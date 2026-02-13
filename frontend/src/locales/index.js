// UI Translations for all supported languages
// Order based on Hiroshima visitor statistics

const translations = {
  // English (default)
  en: {
    // Language selector
    languageLabel: 'Language',

    // Name input
    enterName: 'What\'s your name?',
    namePlaceholder: 'e.g., John Smith (first name only is also OK)',
    start: 'Start',
    next: 'Next',
    back: 'Back',

    // Result page
    yourKanjiName: 'Your Kanji Name',
    matchingScore: 'Matching Score',
    total: 'Total',
    gender: 'Gender',
    motivation: 'Motivation',

    // Calligrapher section
    calligrapherTitle: 'A Calligrapher Will Write Your Name with a Brush',
    calligrapherDesc: 'A professional calligrapher will write your kanji name in beautiful brush calligraphy and send it to you via email.',
    calligrapherDescPaid: 'Enter your email address to receive your handwritten calligraphy artwork.',
    emailWarning: '※If the email address is incorrect, we will not be able to deliver your artwork. Please enter it carefully.',
    emailPlaceholder: 'Email address',
    request: 'Request',
    sendCalligraphy: 'Apply',
    sending: 'Sending...',
    thankYou: 'Thank you! Your calligraphy will be delivered to your email within one week.',
    requestError: 'Failed to send request. Please try again.',

    // Landing page
    landingTitle: 'Get Your Unique Kanji Name',
    landingDesc: 'Discover your personalized Japanese kanji name, handwritten by a professional calligrapher and delivered to your email.',
    feature1: 'Answer questions that explore your inner self',
    feature2: 'Your unique kanji name is generated',
    feature3: 'Professional calligraphy delivered by email',
    priceLabel: 'Service Fee',
    termsLink: 'Terms of Service',
    startFree: 'Start Free',

    // Loading messages
    scrollHintCalligraphy: 'Enter your email to receive a calligraphy artwork',

    loading1: 'Analyzing your personality...',
    loading2: 'Selecting the perfect kanji...',
    loading3: 'Creating your story...',
    loading4: 'Almost done...'
  },

  // French
  fr: {
    languageLabel: 'Langue',
    enterName: 'Comment vous appelez-vous ?',
    namePlaceholder: 'ex. : Jean Dupont (prénom seul aussi OK)',
    start: 'Commencer',
    next: 'Suivant',
    back: 'Retour',

    yourKanjiName: 'Votre nom en kanji',
    matchingScore: 'Score de correspondance',
    total: 'Total',
    gender: 'Genre',
    motivation: 'Motivation',

    calligrapherTitle: 'Un calligraphe \u00e9crira votre nom au pinceau',
    calligrapherDesc: 'Un calligraphe professionnel \u00e9crira votre nom en kanji dans une belle calligraphie au pinceau et vous l\'enverra par e-mail.',
    calligrapherDescPaid: 'Entrez votre adresse e-mail pour recevoir votre calligraphie manuscrite.',
    emailWarning: '※Si l\'adresse e-mail est incorrecte, nous ne pourrons pas vous livrer votre œuvre. Veuillez la saisir avec soin.',
    emailPlaceholder: 'Adresse e-mail',
    request: 'Demander',
    sendCalligraphy: 'S\'inscrire',
    sending: 'Envoi en cours...',
    thankYou: 'Merci ! Votre calligraphie vous sera envoy\u00e9e par e-mail sous une semaine.',
    requestError: 'Échec de l\'envoi. Veuillez réessayer.',

    landingTitle: 'Obtenez votre nom Kanji unique',
    landingDesc: 'Découvrez votre nom japonais personnalisé en kanji, écrit à la main par un calligraphe professionnel.',
    feature1: 'Répondez à des questions qui explorent votre personnalité profonde',
    feature2: 'Votre nom kanji unique est généré',
    feature3: 'Calligraphie professionnelle envoyée par e-mail',
    priceLabel: 'Frais de service',
    termsLink: 'Conditions d\'utilisation',
    startFree: 'Commencer gratuitement',

    scrollHintCalligraphy: 'Entrez votre e-mail pour recevoir une calligraphie',

    loading1: 'Analyse de votre personnalit\u00e9...',
    loading2: 'S\u00e9lection des kanji parfaits...',
    loading3: 'Cr\u00e9ation de votre histoire...',
    loading4: 'Presque termin\u00e9...'
  },

  // German
  de: {
    languageLabel: 'Sprache',
    enterName: 'Wie heißen Sie?',
    namePlaceholder: 'z.B. Max Müller (nur Vorname auch OK)',
    start: 'Starten',
    next: 'Weiter',
    back: 'Zurück',

    yourKanjiName: 'Ihr Kanji-Name',
    matchingScore: '\u00dcbereinstimmungswert',
    total: 'Gesamt',
    gender: 'Geschlecht',
    motivation: 'Motivation',

    calligrapherTitle: 'Ein Kalligraph schreibt Ihren Namen mit dem Pinsel',
    calligrapherDesc: 'Ein professioneller Kalligraph wird Ihren Kanji-Namen in sch\u00f6ner Pinselkalligraphie schreiben und Ihnen per E-Mail zusenden.',
    calligrapherDescPaid: 'Geben Sie Ihre E-Mail-Adresse ein, um Ihr handgeschriebenes Kalligraphie-Kunstwerk zu erhalten.',
    emailWarning: '※Wenn die E-Mail-Adresse falsch ist, können wir Ihr Kunstwerk nicht liefern. Bitte geben Sie sie sorgfältig ein.',
    emailPlaceholder: 'E-Mail-Adresse',
    request: 'Anfordern',
    sendCalligraphy: 'Anmelden',
    sending: 'Wird gesendet...',
    thankYou: 'Vielen Dank! Ihre Kalligraphie wird Ihnen innerhalb einer Woche per E-Mail zugesandt.',
    requestError: 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut.',

    landingTitle: 'Erhalten Sie Ihren einzigartigen Kanji-Namen',
    landingDesc: 'Entdecken Sie Ihren personalisierten japanischen Kanji-Namen, handgeschrieben von einem professionellen Kalligraphen.',
    feature1: 'Beantworten Sie Fragen, die Ihr inneres Selbst erkunden',
    feature2: 'Ihr einzigartiger Kanji-Name wird generiert',
    feature3: 'Professionelle Kalligraphie per E-Mail geliefert',
    priceLabel: 'Servicegebühr',
    termsLink: 'Nutzungsbedingungen',
    startFree: 'Kostenlos starten',

    scrollHintCalligraphy: 'E-Mail eingeben, um ein Kalligraphie-Kunstwerk zu erhalten',

    loading1: 'Analyse Ihrer Pers\u00f6nlichkeit...',
    loading2: 'Auswahl der perfekten Kanji...',
    loading3: 'Erstellung Ihrer Geschichte...',
    loading4: 'Fast fertig...'
  },

  // Spanish
  es: {
    languageLabel: 'Idioma',
    enterName: '¿Cómo te llamas?',
    namePlaceholder: 'ej. Juan García (solo nombre también OK)',
    start: 'Comenzar',
    next: 'Siguiente',
    back: 'Atrás',

    yourKanjiName: 'Tu nombre en kanji',
    matchingScore: 'Puntuaci\u00f3n de coincidencia',
    total: 'Total',
    gender: 'G\u00e9nero',
    motivation: 'Motivaci\u00f3n',

    calligrapherTitle: 'Un cal\u00edgrafo escribir\u00e1 tu nombre con pincel',
    calligrapherDesc: 'Un cal\u00edgrafo profesional escribir\u00e1 tu nombre en kanji con hermosa caligraf\u00eda de pincel y te lo enviar\u00e1 por correo electr\u00f3nico.',
    calligrapherDescPaid: 'Ingresa tu correo electrónico para recibir tu caligrafía manuscrita.',
    emailWarning: '※Si el correo electrónico es incorrecto, no podremos entregar tu obra. Por favor, ingrésalo con cuidado.',
    emailPlaceholder: 'Correo electr\u00f3nico',
    request: 'Solicitar',
    sendCalligraphy: 'Solicitar',
    sending: 'Enviando...',
    thankYou: '\u00a1Gracias! Su caligraf\u00eda ser\u00e1 enviada a su correo electr\u00f3nico en un plazo de una semana.',
    requestError: 'Error al enviar. Por favor, int\u00e9ntalo de nuevo.',

    landingTitle: 'Obtén tu nombre Kanji único',
    landingDesc: 'Descubre tu nombre japonés personalizado en kanji, escrito a mano por un calígrafo profesional.',
    feature1: 'Responde preguntas que exploran tu ser interior',
    feature2: 'Se genera tu nombre kanji único',
    feature3: 'Caligrafía profesional enviada por correo',
    priceLabel: 'Tarifa del servicio',
    termsLink: 'Términos de servicio',
    startFree: 'Comenzar gratis',

    scrollHintCalligraphy: 'Ingresa tu correo para recibir una caligrafía',

    loading1: 'Analizando tu personalidad...',
    loading2: 'Seleccionando los kanji perfectos...',
    loading3: 'Creando tu historia...',
    loading4: 'Casi listo...'
  },

  // Portuguese
  pt: {
    languageLabel: 'Idioma',
    enterName: 'Qual é o seu nome?',
    namePlaceholder: 'ex. João Silva (só primeiro nome também OK)',
    start: 'Começar',
    next: 'Próximo',
    back: 'Voltar',

    yourKanjiName: 'Seu nome em kanji',
    matchingScore: 'Pontuação de correspondência',
    total: 'Total',
    gender: 'Gênero',
    motivation: 'Motivação',

    calligrapherTitle: 'Um calígrafo escreverá seu nome com pincel',
    calligrapherDesc: 'Um calígrafo profissional escreverá seu nome em kanji com bela caligrafia a pincel e enviará para você por e-mail.',
    calligrapherDescPaid: 'Insira seu endereço de e-mail para receber sua obra de caligrafia manuscrita.',
    emailWarning: '※Se o endereço de e-mail estiver incorreto, não poderemos entregar sua obra. Por favor, insira com cuidado.',
    emailPlaceholder: 'Endereço de e-mail',
    request: 'Solicitar',
    sendCalligraphy: 'Solicitar',
    sending: 'Enviando...',
    thankYou: 'Obrigado! Sua caligrafia ser\u00e1 enviada para o seu e-mail dentro de uma semana.',
    requestError: 'Falha ao enviar. Por favor, tente novamente.',

    landingTitle: 'Obtenha seu nome Kanji único',
    landingDesc: 'Descubra seu nome japonês personalizado em kanji, escrito à mão por um calígrafo profissional.',
    feature1: 'Responda perguntas que exploram seu eu interior',
    feature2: 'Seu nome kanji único é gerado',
    feature3: 'Caligrafia profissional entregue por e-mail',
    priceLabel: 'Taxa de serviço',
    termsLink: 'Termos de serviço',
    startFree: 'Começar grátis',

    scrollHintCalligraphy: 'Insira seu e-mail para receber uma obra de caligrafia',

    loading1: 'Analisando sua personalidade...',
    loading2: 'Selecionando os kanji perfeitos...',
    loading3: 'Criando sua história...',
    loading4: 'Quase pronto...'
  },

  // Italian
  it: {
    languageLabel: 'Lingua',
    enterName: 'Come ti chiami?',
    namePlaceholder: 'es. Mario Rossi (solo nome anche OK)',
    start: 'Inizia',
    next: 'Avanti',
    back: 'Indietro',

    yourKanjiName: 'Il tuo nome in kanji',
    matchingScore: 'Punteggio di corrispondenza',
    total: 'Totale',
    gender: 'Genere',
    motivation: 'Motivazione',

    calligrapherTitle: 'Un calligrafo scriver\u00e0 il tuo nome con il pennello',
    calligrapherDesc: 'Un calligrafo professionista scriver\u00e0 il tuo nome in kanji con bella calligrafia a pennello e te lo invier\u00e0 via e-mail.',
    calligrapherDescPaid: 'Inserisci il tuo indirizzo e-mail per ricevere la tua calligrafia scritta a mano.',
    emailWarning: '※Se l\'indirizzo e-mail è errato, non saremo in grado di consegnare la tua opera. Per favore, inseriscilo con attenzione.',
    emailPlaceholder: 'Indirizzo e-mail',
    request: 'Richiedi',
    sendCalligraphy: 'Richiedi',
    sending: 'Invio in corso...',
    thankYou: 'Grazie! La tua calligrafia ti sar\u00e0 inviata via e-mail entro una settimana.',
    requestError: 'Invio non riuscito. Riprova.',

    landingTitle: 'Ottieni il tuo nome Kanji unico',
    landingDesc: 'Scopri il tuo nome giapponese personalizzato in kanji, scritto a mano da un calligrafo professionista.',
    feature1: 'Rispondi a domande che esplorano il tuo io interiore',
    feature2: 'Il tuo nome kanji unico viene generato',
    feature3: 'Calligrafia professionale consegnata via e-mail',
    priceLabel: 'Tariffa del servizio',
    termsLink: 'Termini di servizio',
    startFree: 'Inizia gratis',

    scrollHintCalligraphy: 'Inserisci la tua e-mail per ricevere un\'opera di calligrafia',

    loading1: 'Analisi della tua personalit\u00e0...',
    loading2: 'Selezione dei kanji perfetti...',
    loading3: 'Creazione della tua storia...',
    loading4: 'Quasi finito...'
  },

  // Thai
  th: {
    languageLabel: '\u0E20\u0E32\u0E29\u0E32',
    enterName: 'คุณชื่ออะไร?',
    namePlaceholder: 'เช่น สมชาย ใจดี (ชื่อเดียวก็ OK)',
    start: '\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19',
    next: '\u0E16\u0E31\u0E14\u0E44\u0E1B',
    back: 'ย้อนกลับ',

    yourKanjiName: '\u0E0A\u0E37\u0E48\u0E2D\u0E04\u0E31\u0E19\u0E08\u0E34\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13',
    matchingScore: '\u0E04\u0E30\u0E41\u0E19\u0E19\u0E04\u0E27\u0E32\u0E21\u0E40\u0E02\u0E49\u0E32\u0E01\u0E31\u0E19',
    total: '\u0E23\u0E27\u0E21',
    gender: '\u0E40\u0E1E\u0E28',
    motivation: '\u0E41\u0E23\u0E07\u0E08\u0E39\u0E07\u0E43\u0E08',

    calligrapherTitle: '\u0E19\u0E31\u0E01\u0E40\u0E02\u0E35\u0E22\u0E19\u0E1E\u0E39\u0E48\u0E01\u0E31\u0E19\u0E08\u0E30\u0E40\u0E02\u0E35\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E14\u0E49\u0E27\u0E22\u0E1E\u0E39\u0E48\u0E01\u0E31\u0E19',
    calligrapherDesc: '\u0E19\u0E31\u0E01\u0E40\u0E02\u0E35\u0E22\u0E19\u0E1E\u0E39\u0E48\u0E01\u0E31\u0E19\u0E21\u0E37\u0E2D\u0E2D\u0E32\u0E0A\u0E35\u0E1E\u0E08\u0E30\u0E40\u0E02\u0E35\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E04\u0E31\u0E19\u0E08\u0E34\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E14\u0E49\u0E27\u0E22\u0E1E\u0E39\u0E48\u0E01\u0E31\u0E19\u0E2D\u0E31\u0E01\u0E29\u0E23\u0E27\u0E34\u0E08\u0E34\u0E15\u0E23\u0E2D\u0E31\u0E19\u0E2A\u0E27\u0E22\u0E07\u0E32\u0E21 \u0E41\u0E25\u0E30\u0E2A\u0E48\u0E07\u0E16\u0E36\u0E07\u0E04\u0E38\u0E13\u0E17\u0E32\u0E07\u0E2D\u0E35\u0E40\u0E21\u0E25',
    calligrapherDescPaid: 'กรอกอีเมลของคุณเพื่อรับงานเขียนพู่กันที่เขียนด้วยมือ',
    emailWarning: '※หากอีเมลไม่ถูกต้อง เราจะไม่สามารถส่งผลงานให้คุณได้ กรุณากรอกอย่างระมัดระวัง',
    emailPlaceholder: '\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E2D\u0E35\u0E40\u0E21\u0E25',
    request: '\u0E02\u0E2D\u0E23\u0E31\u0E1A',
    sendCalligraphy: 'สมัคร',
    sending: '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E48\u0E07...',
    thankYou: '\u0E02\u0E2D\u0E1A\u0E04\u0E38\u0E13! \u0E07\u0E32\u0E19\u0E40\u0E02\u0E35\u0E22\u0E19\u0E1E\u0E39\u0E48\u0E01\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E08\u0E30\u0E16\u0E39\u0E01\u0E2A\u0E48\u0E07\u0E17\u0E32\u0E07\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E20\u0E32\u0E22\u0E43\u0E19\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C',
    requestError: '\u0E2A\u0E48\u0E07\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E25\u0E2D\u0E07\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07',

    landingTitle: 'รับชื่อคันจิที่ไม่ซ้ำใครของคุณ',
    landingDesc: 'ค้นพบชื่อญี่ปุ่นเฉพาะตัวในรูปแบบคันจิ เขียนด้วยมือโดยนักเขียนพู่กันมืออาชีพ',
    feature1: 'ตอบคำถามที่สำรวจตัวตนภายในของคุณ',
    feature2: 'ชื่อคันจิที่เป็นเอกลักษณ์ของคุณถูกสร้างขึ้น',
    feature3: 'งานเขียนพู่กันมืออาชีพส่งทางอีเมล',
    priceLabel: 'ค่าบริการ',
    termsLink: 'ข้อกำหนดการใช้บริการ',
    startFree: 'เริ่มต้นฟรี',

    scrollHintCalligraphy: 'กรอกอีเมลเพื่อรับผลงานเขียนพู่กัน',

    loading1: '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E1A\u0E38\u0E04\u0E25\u0E34\u0E01\u0E20\u0E32\u0E1E\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13...',
    loading2: '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E04\u0E31\u0E19\u0E08\u0E34\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E21\u0E32\u0E30\u0E2A\u0E21...',
    loading3: '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E23\u0E32\u0E27\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13...',
    loading4: '\u0E43\u0E01\u0E25\u0E49\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27...'
  },

  // Vietnamese
  vi: {
    languageLabel: 'Ng\u00f4n ng\u1eef',
    enterName: 'Bạn tên gì?',
    namePlaceholder: 'vd: Nguyễn Văn An (chỉ tên cũng OK)',
    start: 'B\u1EAFt \u0111\u1EA7u',
    next: 'Ti\u1EBFp theo',
    back: 'Quay lại',

    yourKanjiName: 'T\u00ean Kanji c\u1EE7a b\u1EA1n',
    matchingScore: '\u0110i\u1EC3m ph\u00f9 h\u1EE3p',
    total: 'T\u1ED5ng',
    gender: 'Gi\u1EDBi t\u00ednh',
    motivation: '\u0110\u1ED9ng l\u1EF1c',

    calligrapherTitle: 'Nh\u00e0 th\u01B0 ph\u00e1p s\u1EBD vi\u1EBFt t\u00ean b\u1EA1n b\u1EB1ng b\u00fat l\u00f4ng',
    calligrapherDesc: 'Nh\u00e0 th\u01B0 ph\u00e1p chuy\u00ean nghi\u1EC7p s\u1EBD vi\u1EBFt t\u00ean kanji c\u1EE7a b\u1EA1n b\u1EB1ng th\u01B0 ph\u00e1p b\u00fat l\u00f4ng tuy\u1EC7t \u0111\u1EB9p v\u00e0 g\u1EEDi cho b\u1EA1n qua email.',
    calligrapherDescPaid: 'Nhập địa chỉ email của bạn để nhận tác phẩm thư pháp viết tay.',
    emailWarning: '※Nếu địa chỉ email không chính xác, chúng tôi sẽ không thể gửi tác phẩm cho bạn. Vui lòng nhập cẩn thận.',
    emailPlaceholder: '\u0110\u1ECBa ch\u1EC9 email',
    request: 'Y\u00eau c\u1EA7u',
    sendCalligraphy: 'Đăng ký',
    sending: '\u0110ang g\u1EEDi...',
    thankYou: 'C\u1EA3m \u01A1n b\u1EA1n! T\u00e1c ph\u1EA9m th\u01B0 ph\u00e1p s\u1EBD \u0111\u01B0\u1EE3c g\u1EEDi \u0111\u1EBFn email c\u1EE7a b\u1EA1n trong v\u00f2ng m\u1ED9t tu\u1EA7n.',
    requestError: 'G\u1EEDi kh\u00f4ng th\u00e0nh c\u00f4ng. Vui l\u00f2ng th\u1EED l\u1EA1i.',

    landingTitle: 'Nhận tên Kanji độc đáo của bạn',
    landingDesc: 'Khám phá tên Nhật Bản cá nhân hóa bằng kanji, viết tay bởi nhà thư pháp chuyên nghiệp.',
    feature1: 'Trả lời câu hỏi khám phá con người bên trong bạn',
    feature2: 'Tên kanji độc đáo của bạn được tạo ra',
    feature3: 'Thư pháp chuyên nghiệp gửi qua email',
    priceLabel: 'Phí dịch vụ',
    termsLink: 'Điều khoản dịch vụ',
    startFree: 'Bắt đầu miễn phí',

    scrollHintCalligraphy: 'Nhập email để nhận tác phẩm thư pháp',

    loading1: '\u0110ang ph\u00e2n t\u00edch t\u00ednh c\u00e1ch c\u1EE7a b\u1EA1n...',
    loading2: '\u0110ang ch\u1ECDn kanji ho\u00e0n h\u1EA3o...',
    loading3: '\u0110ang t\u1EA1o c\u00e2u chuy\u1EC7n c\u1EE7a b\u1EA1n...',
    loading4: 'S\u1EAFp xong r\u1ED3i...'
  },

  // Indonesian
  id: {
    languageLabel: 'Bahasa',
    enterName: 'Siapa namamu?',
    namePlaceholder: 'contoh: Budi Santoso (nama depan saja juga OK)',
    start: 'Mulai',
    next: 'Selanjutnya',
    back: 'Kembali',

    yourKanjiName: 'Nama Kanji Anda',
    matchingScore: 'Skor Kecocokan',
    total: 'Total',
    gender: 'Gender',
    motivation: 'Motivasi',

    calligrapherTitle: 'Seorang Kaligrafer Akan Menulis Nama Anda dengan Kuas',
    calligrapherDesc: 'Seorang kaligrafer profesional akan menulis nama kanji Anda dalam kaligrafi kuas yang indah dan mengirimkannya kepada Anda melalui email.',
    calligrapherDescPaid: 'Masukkan alamat email Anda untuk menerima karya kaligrafi tulisan tangan.',
    emailWarning: '※Jika alamat email salah, kami tidak dapat mengirimkan karya Anda. Harap masukkan dengan hati-hati.',
    emailPlaceholder: 'Alamat email',
    request: 'Minta',
    sendCalligraphy: 'Daftar',
    sending: 'Mengirim...',
    thankYou: 'Terima kasih! Kaligrafi Anda akan dikirim ke email Anda dalam satu minggu.',
    requestError: 'Gagal mengirim. Silakan coba lagi.',

    landingTitle: 'Dapatkan Nama Kanji Unik Anda',
    landingDesc: 'Temukan nama Jepang pribadi Anda dalam kanji, ditulis tangan oleh kaligrafer profesional.',
    feature1: 'Jawab pertanyaan yang mengeksplorasi diri Anda yang sebenarnya',
    feature2: 'Nama kanji unik Anda dihasilkan',
    feature3: 'Kaligrafi profesional dikirim via email',
    priceLabel: 'Biaya Layanan',
    termsLink: 'Syarat Layanan',
    startFree: 'Mulai Gratis',

    scrollHintCalligraphy: 'Masukkan email untuk menerima karya kaligrafi',

    loading1: 'Menganalisis kepribadian Anda...',
    loading2: 'Memilih kanji yang sempurna...',
    loading3: 'Membuat cerita Anda...',
    loading4: 'Hampir selesai...'
  },

  // Korean
  ko: {
    languageLabel: '\uc5b8\uc5b4',
    enterName: '이름이 뭐예요?',
    namePlaceholder: '예: 홍길동 (이름만도 OK)',
    start: '\uC2DC\uC791',
    next: '\uB2E4\uC74C',
    back: '이전',

    yourKanjiName: '\uB2F9\uC2E0\uC758 \uD55C\uC790 \uC774\uB984',
    matchingScore: '\uB9E4\uCE6D \uC810\uC218',
    total: '\uC885\uD569',
    gender: '\uC131\uBCC4',
    motivation: '\uB3D9\uAE30',

    calligrapherTitle: '\uC11C\uC608\uAC00\uAC00 \uBD93\uC73C\uB85C \uB2F9\uC2E0\uC758 \uC774\uB984\uC744 \uC368\uB4DC\uB9BD\uB2C8\uB2E4',
    calligrapherDesc: '\uC804\uBB38 \uC11C\uC608\uAC00\uAC00 \uC544\uB984\uB2E4\uC6B4 \uBD93\uAE00\uC528\uB85C \uB2F9\uC2E0\uC758 \uD55C\uC790 \uC774\uB984\uC744 \uC4F0\uACE0 \uC774\uBA54\uC77C\uB85C \uBCF4\uB0B4\uB4DC\uB9BD\uB2C8\uB2E4.',
    calligrapherDescPaid: '손으로 쓴 서예 작품을 받으시려면 이메일 주소를 입력하세요.',
    emailWarning: '※이메일 주소가 잘못되면 작품을 배송할 수 없습니다. 신중하게 입력해 주세요.',
    emailPlaceholder: '\uC774\uBA54\uC77C \uC8FC\uC18C',
    request: '\uC2E0\uCCAD',
    sendCalligraphy: '신청하기',
    sending: '\uC804\uC1A1 \uC911...',
    thankYou: '\uAC10\uC0AC\uD569\uB2C8\uB2E4! \uC11C\uC608 \uC791\uD488\uC740 1\uC8FC\uC77C \uC774\uB0B4\uC5D0 \uC774\uBA54\uC77C\uB85C \uBCF4\uB0B4\uB4DC\uB9BD\uB2C8\uB2E4.',
    requestError: '\uC804\uC1A1\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.',

    landingTitle: '나만의 한자 이름을 받으세요',
    landingDesc: '나만의 특별한 한자 이름을 만들고, 전문 서예가가 정성껏 손글씨로 보내드립니다.',
    feature1: '내면을 탐구하는 질문에 답하세요',
    feature2: '고유한 한자 이름이 생성됩니다',
    feature3: '전문 서예를 이메일로 배송',
    priceLabel: '서비스 요금',
    termsLink: '서비스 약관',
    startFree: '무료로 시작',

    scrollHintCalligraphy: '이메일을 입력하여 서예 작품을 받으세요',

    loading1: '\uB2F9\uC2E0\uC758 \uC131\uACA9\uC744 \uBD84\uC11D \uC911...',
    loading2: '\uC644\uBCBD\uD55C \uD55C\uC790\uB97C \uC120\uD0DD \uC911...',
    loading3: '\uB2F9\uC2E0\uC758 \uC774\uC57C\uAE30\uB97C \uC791\uC131 \uC911...',
    loading4: '\uAC70\uC758 \uC644\uB8CC...'
  },

  // Japanese
  ja: {
    languageLabel: '\u8a00\u8a9e',
    enterName: 'お名前を教えてください',
    namePlaceholder: '例: John Smith（ファーストネームだけでもOK）',
    start: '\u59CB\u3081\u308B',
    next: '\u6B21\u3078',
    back: '戻る',

    yourKanjiName: '\u3042\u306A\u305F\u306E\u6F22\u5B57\u540D',
    matchingScore: '\u30DE\u30C3\u30C1\u30F3\u30B0\u5EA6',
    total: '\u7DCF\u5408',
    gender: '\u6027\u5225\u9069\u5408',
    motivation: '\u52D5\u6A5F\u9069\u5408',

    calligrapherTitle: '\u66F8\u9053\u5BB6\u304C\u3042\u306A\u305F\u306E\u540D\u524D\u3092\u7B46\u3067\u66F8\u304D\u307E\u3059',
    calligrapherDesc: '\u30D7\u30ED\u306E\u66F8\u9053\u5BB6\u304C\u3042\u306A\u305F\u306E\u6F22\u5B57\u540D\u3092\u7F8E\u3057\u3044\u7B46\u6587\u5B57\u3067\u66F8\u304D\u3001\u30E1\u30FC\u30EB\u3067\u304A\u5C4A\u3051\u3057\u307E\u3059\u3002',
    calligrapherDescPaid: '手書きの書道作品をお届けするため、メールアドレスを入力してください。',
    emailWarning: '※メールアドレスが間違っていた場合は、お届けすることができませんので慎重に入力してください。',
    emailPlaceholder: '\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9',
    request: '\u7533\u3057\u8FBC\u3080',
    sendCalligraphy: '申し込む',
    sending: '\u9001\u4FE1\u4E2D...',
    thankYou: '\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3059\uFF01\u66F8\u9053\u4F5C\u54C1\u306F1\u9031\u9593\u4EE5\u5185\u306B\u30E1\u30FC\u30EB\u306B\u3066\u304A\u5C4A\u3051\u3044\u305F\u3057\u307E\u3059\u3002',
    requestError: '\u9001\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002',

    landingTitle: 'あなただけの漢字名を手に入れよう',
    landingDesc: 'あなただけのオリジナル漢字名を作成し、プロの書道家が心を込めて手書きでお届けします。',
    feature1: 'あなたの内面を探る質問に回答',
    feature2: 'あなただけの漢字名を生成',
    feature3: 'プロの書道をメールでお届け',
    priceLabel: 'サービス料金',
    termsLink: '利用規約',
    startFree: '無料で始める',

    scrollHintCalligraphy: 'メールアドレスを入力して書道作品を受け取る',

    loading1: '\u6027\u683C\u3092\u5206\u6790\u4E2D...',
    loading2: '\u6700\u9069\u306A\u6F22\u5B57\u3092\u9078\u5B9A\u4E2D...',
    loading3: '\u8AAC\u660E\u6587\u3092\u4F5C\u6210\u4E2D...',
    loading4: '\u3082\u3046\u3059\u3050\u5B8C\u6210\u3067\u3059...'
  }
};

export default translations;
