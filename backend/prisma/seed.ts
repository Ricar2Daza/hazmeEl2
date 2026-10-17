import {
  PrismaClient,
  Job,
  Application,
  Notification,
  JobStatus,
  ApplicationStatus,
  NotificationType,
} from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../.env' });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('Test1234!', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'u1@test.com' },
      update: {},
      create: {
        email: 'u1@test.com',
        passwordHash,
        fullName: 'Ana García',
        emailVerified: true,
        phone: '+34600111111',
        companyName: 'TechSolutions S.L.',
        bio: 'Especialista en proyectos tecnológicos con 5 años de experiencia.',
        experienceYears: 5,
        skills: ['Gestión de proyectos', 'Agile', 'Scrum'],
        locationAddress: 'Calle Mayor 10, Madrid',
      },
    }),
    prisma.user.upsert({
      where: { email: 'u2@test.com' },
      update: {},
      create: {
        email: 'u2@test.com',
        passwordHash,
        fullName: 'Carlos Pérez',
        emailVerified: true,
        phone: '+34600222222',
        bio: 'Desarrollador full-stack con pasión por el código limpio.',
        experienceYears: 4,
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
        portfolioUrl: 'https://carlosperez.dev',
        locationAddress: 'Gran Vía 45, Madrid',
      },
    }),
    prisma.user.upsert({
      where: { email: 'u3@test.com' },
      update: {},
      create: {
        email: 'u3@test.com',
        passwordHash,
        fullName: 'María López',
        emailVerified: true,
        phone: '+34600333333',
        bio: 'Arquitecta y diseñadora de interiores.',
        experienceYears: 8,
        skills: ['AutoCAD', 'SketchUp', 'Diseño 3D'],
        locationAddress: 'Paseo de Gracia 120, Barcelona',
      },
    }),
    prisma.user.upsert({
      where: { email: 'u4@test.com' },
      update: {},
      create: {
        email: 'u4@test.com',
        passwordHash,
        fullName: 'Juan Martínez',
        emailVerified: true,
        phone: '+34600444444',
        bio: 'Técnico de mantenimiento polivalente.',
        experienceYears: 10,
        skills: ['Electricidad', 'Fontanería', 'Carpintería'],
        locationAddress: 'Calle Serrano 80, Madrid',
      },
    }),
  ]);

  console.log('✅ Usuarios creados');

  const categoriesData = [
    { name: 'Tecnología', slug: 'tecnologia', description: 'Proyectos de software, IT, desarrollo web, etc.' },
    { name: 'Construcción', slug: 'construccion', description: 'Obras, reformas, albañilería, etc.' },
    { name: 'Diseño', slug: 'diseno', description: 'Diseño gráfico, web, interiores, branding, etc.' },
    { name: 'Limpieza', slug: 'limpieza', description: 'Limpieza de hogares, oficinas, comunidades, etc.' },
    { name: 'Mantenimiento', slug: 'mantenimiento', description: 'Reparaciones, electricidad, fontanería, etc.' },
    { name: 'Otros', slug: 'otros', description: 'Servicios y trabajos que no encajan en las categorías anteriores.' },
  ];

  const categories = await Promise.all(
    categoriesData.map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      })
    )
  );

  console.log('✅ Categorías creadas');

  const [u1, u2, u3, u4] = users;
  const [catTec, catCons, catDis, catLim, catMant] = categories;
  const now = new Date();
  const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  // Trabajos de ejemplo.
  // Idempotente: si ya existe un trabajo con el mismo título y publicador, se reutiliza
  // (no se duplica al volver a ejecutar `prisma db seed`).
  const jobsData = [
    {
      title: 'Desarrollar landing page para startup',
      description:
        'Necesitamos desarrollar una landing page moderna con formulario de contacto y sección de precios. Incluir diseño responsive.',
      locationAddress: 'Madrid, España',
      budgetMin: 800,
      budgetMax: 1500,
      deadlineDate: daysFromNow(30),
      categoryId: catTec.id,
      publisherId: u1.id,
    },
    {
      title: 'Reformar baño completo',
      description: 'Reforma de baño de 6m2: cambiar azulejos, plato de ducha, inodoro y lavabo. Presupuesto cerrado.',
      locationAddress: 'Barcelona, España',
      budgetMin: 3000,
      budgetMax: 5000,
      deadlineDate: daysFromNow(60),
      categoryId: catCons.id,
      publisherId: u3.id,
    },
    {
      title: 'Diseño de logotipo para restaurante',
      description:
        'Logotipo para restaurante de comida mediterránea. Necesitamos paleta cálida y tipografía elegante. Entregar archivos vectoriales.',
      locationAddress: 'Valencia, España',
      budgetMin: 200,
      budgetMax: 500,
      deadlineDate: daysFromNow(15),
      categoryId: catDis.id,
      publisherId: u1.id,
    },
    {
      title: 'Limpieza profunda de piso',
      description: 'Limpieza a fondo de piso de 80m2, 3 habitaciones, cocina y 2 baños. Una vez cada 2 semanas.',
      locationAddress: 'Madrid, España',
      budgetMin: 80,
      budgetMax: 120,
      deadlineDate: daysFromNow(7),
      categoryId: catLim.id,
      publisherId: u2.id,
    },
    {
      title: 'Reparar caldera de gas',
      description: 'Caldera de gas no enciende. Necesito técnico certificado que pueda venir esta semana.',
      locationAddress: 'Sevilla, España',
      budgetMin: 100,
      budgetMax: 300,
      deadlineDate: daysFromNow(5),
      categoryId: catMant.id,
      publisherId: u3.id,
    },
    {
      title: 'Aplicación móvil de delivery',
      description: 'Desarrollo de app móvil para servicio de delivery local. iOS y Android. Backend incluido.',
      locationAddress: 'Madrid, España',
      budgetMin: 12000,
      budgetMax: 20000,
      deadlineDate: daysFromNow(120),
      categoryId: catTec.id,
      publisherId: u4.id,
      status: JobStatus.EN_PROGRESO,
    },
    {
      title: 'Branding para marca de ropa',
      description: 'Identidad corporativa completa: logotipo, paleta, tipografía, packaging y redes sociales.',
      locationAddress: 'Bilbao, España',
      budgetMin: 1000,
      budgetMax: 2500,
      deadlineDate: daysFromNow(45),
      categoryId: catDis.id,
      publisherId: u2.id,
    },
    {
      title: 'Mantenimiento oficinas',
      description: 'Servicio de mantenimiento mensual para oficina de 200m2: electricidad, fontanería y climatización.',
      locationAddress: 'Zaragoza, España',
      budgetMin: 200,
      budgetMax: 400,
      deadlineDate: daysFromNow(10),
      categoryId: catMant.id,
      publisherId: u1.id,
    },
  ];

  const jobs: Job[] = [];
  for (const data of jobsData) {
    const existing = await prisma.job.findFirst({
      where: { title: data.title, publisherId: data.publisherId },
    });
    jobs.push(existing ?? (await prisma.job.create({ data })));
  }

  console.log('✅ Jobs creados');

  const applicationsData = [
    {
      jobIndex: 0,
      applicantId: u2.id,
      message: 'Tengo experiencia desarrollando landing pages con React y Tailwind. Podría tenerlo listo en 10 días.',
      status: ApplicationStatus.PENDIENTE,
    },
    {
      jobIndex: 0,
      applicantId: u3.id,
      message: 'Soy full-stack developer con portfolio disponible. ¡Contáctame para ver ejemplos!',
      status: ApplicationStatus.ACEPTADA,
    },
    {
      jobIndex: 3,
      applicantId: u4.id,
      message: 'Disponible los martes y jueves. Tengo mis propios productos de limpieza.',
      status: ApplicationStatus.PENDIENTE,
    },
    {
      jobIndex: 4,
      applicantId: u4.id,
      message: 'Técnico certificado en gas. Puedo venir el miércoles por la mañana.',
      status: ApplicationStatus.PENDIENTE,
    },
    {
      jobIndex: 2,
      applicantId: u3.id,
      message: 'Amplia experiencia en branding para hostelería. Te envío mi portfolio por email.',
      status: ApplicationStatus.RECHAZADA,
    },
    {
      jobIndex: 7,
      applicantId: u4.id,
      message: 'Polivalente con 10 años de experiencia. Contrato mensual cerrado.',
      status: ApplicationStatus.PENDIENTE,
    },
  ];

  // Idempotente: la clave única (jobId, applicantId) evita duplicados al re-ejecutar el seed.
  const applications: Application[] = [];
  for (const { jobIndex, ...rest } of applicationsData) {
    const jobId = jobs[jobIndex].id;
    applications.push(
      await prisma.application.upsert({
        where: { jobId_applicantId: { jobId, applicantId: rest.applicantId } },
        update: {},
        create: { jobId, ...rest },
      })
    );
  }

  console.log('✅ Applications creadas');

  const notificationsData = [
    {
      userId: u1.id,
      type: NotificationType.NEW_APPLICATION,
      title: 'Nueva postulación',
      message: 'Carlos Pérez se ha postulado a tu trabajo "Desarrollar landing page para startup".',
      jobIndex: 0,
    },
    {
      userId: u3.id,
      type: NotificationType.APPLICATION_ACCEPTED,
      title: '¡Postulación aceptada!',
      message: 'Tu postulación a "Desarrollar landing page para startup" ha sido aceptada.',
      jobIndex: 0,
    },
    {
      userId: u3.id,
      type: NotificationType.APPLICATION_REJECTED,
      title: 'Postulación rechazada',
      message: 'Tu postulación a "Diseño de logotipo para restaurante" ha sido rechazada.',
      jobIndex: 2,
    },
  ];

  // Idempotente: se crea la notificación sólo si no existe una equivalente.
  const notifications: Notification[] = [];
  for (const { jobIndex, ...rest } of notificationsData) {
    const relatedJobId = jobs[jobIndex].id;
    const existing = await prisma.notification.findFirst({
      where: { userId: rest.userId, type: rest.type, title: rest.title, relatedJobId },
    });
    notifications.push(existing ?? (await prisma.notification.create({ data: { ...rest, relatedJobId } })));
  }

  console.log('✅ Notificaciones creadas');

  console.log('\n🌱 Seed completado con éxito!');
  console.log(`   - ${users.length} usuarios`);
  console.log(`   - ${categories.length} categorías`);
  console.log(`   - ${jobs.length} trabajos`);
  console.log(`   - ${applications.length} postulaciones`);
  console.log(`   - ${notifications.length} notificaciones`);
  console.log('\n🔐 Cuentas de prueba (todas con contraseña: Test1234!):');
  users.forEach((u) => console.log(`   - ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
