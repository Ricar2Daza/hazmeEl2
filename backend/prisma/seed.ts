import { PrismaClient, JobStatus, ApplicationStatus, NotificationType } from '@prisma/client';
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
        locationLat: 40.4168,
        locationLng: -3.7038,
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
        locationLat: 40.4205,
        locationLng: -3.7055,
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
        locationLat: 41.3977,
        locationLng: 2.1684,
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
        locationLat: 40.4289,
        locationLng: -3.6761,
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

  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Desarrollar landing page para startup',
        description: 'Necesitamos desarrollar una landing page moderna con formulario de contacto y sección de precios. Incluir diseño responsive.',
        locationAddress: 'Madrid, España',
        locationLat: 40.4168,
        locationLng: -3.7038,
        budgetMin: 800,
        budgetMax: 1500,
        deadlineDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        categoryId: catTec.id,
        publisherId: u1.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Reformar baño completo',
        description: 'Reforma de baño de 6m2: cambiar azulejos, plato de ducha, inodoro y lavabo. Presupuesto cerrado.',
        locationAddress: 'Barcelona, España',
        locationLat: 41.3874,
        locationLng: 2.1686,
        budgetMin: 3000,
        budgetMax: 5000,
        deadlineDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        categoryId: catCons.id,
        publisherId: u3.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Diseño de logotipo para restaurante',
        description: 'Logotipo para restaurante de comida mediterránea. Necesitamos paleta cálida y tipografía elegante. Entregar archivos vectoriales.',
        locationAddress: 'Valencia, España',
        locationLat: 39.4699,
        locationLng: -0.3763,
        budgetMin: 200,
        budgetMax: 500,
        deadlineDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        categoryId: catDis.id,
        publisherId: u1.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Limpieza profunda de piso',
        description: 'Limpieza a fondo de piso de 80m2, 3 habitaciones, cocina y 2 baños. Una vez cada 2 semanas.',
        locationAddress: 'Madrid, España',
        locationLat: 40.4203,
        locationLng: -3.7058,
        budgetMin: 80,
        budgetMax: 120,
        deadlineDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        categoryId: catLim.id,
        publisherId: u2.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Reparar caldera de gas',
        description: 'Caldera de gas no enciende. Necesito técnico certificado que pueda venir esta semana.',
        locationAddress: 'Sevilla, España',
        locationLat: 37.3891,
        locationLng: -5.9845,
        budgetMin: 100,
        budgetMax: 300,
        deadlineDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        categoryId: catMant.id,
        publisherId: u3.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Aplicación móvil de delivery',
        description: 'Desarrollo de app móvil para servicio de delivery local. iOS y Android. Backend incluido.',
        locationAddress: 'Madrid, España',
        locationLat: 40.4300,
        locationLng: -3.6900,
        budgetMin: 12000,
        budgetMax: 20000,
        deadlineDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
        categoryId: catTec.id,
        publisherId: u4.id,
        status: JobStatus.EN_PROGRESO,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Branding para marca de ropa',
        description: 'Identidad corporativa completa: logotipo, paleta, tipografía, packaging y redes sociales.',
        locationAddress: 'Bilbao, España',
        locationLat: 43.2630,
        locationLng: -2.9350,
        budgetMin: 1000,
        budgetMax: 2500,
        deadlineDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
        categoryId: catDis.id,
        publisherId: u2.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Mantenimiento oficinas',
        description: 'Servicio de mantenimiento mensual para oficina de 200m2: electricidad, fontanería y climatización.',
        locationAddress: 'Zaragoza, España',
        locationLat: 41.6488,
        locationLng: -0.8891,
        budgetMin: 200,
        budgetMax: 400,
        deadlineDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        categoryId: catMant.id,
        publisherId: u1.id,
      },
    }),
  ]);

  console.log('✅ Jobs creados');

  const applications = await Promise.all([
    prisma.application.create({
      data: {
        jobId: jobs[0].id,
        applicantId: u2.id,
        message: 'Tengo experiencia desarrollando landing pages con React y Tailwind. Podría tenerlo listo en 10 días.',
        status: ApplicationStatus.PENDIENTE,
      },
    }),
    prisma.application.create({
      data: {
        jobId: jobs[0].id,
        applicantId: u3.id,
        message: 'Soy full-stack developer con portfolio disponible. ¡Contáctame para ver ejemplos!',
        status: ApplicationStatus.ACEPTADA,
      },
    }),
    prisma.application.create({
      data: {
        jobId: jobs[3].id,
        applicantId: u4.id,
        message: 'Disponible los martes y jueves. Tengo mis propios productos de limpieza.',
        status: ApplicationStatus.PENDIENTE,
      },
    }),
    prisma.application.create({
      data: {
        jobId: jobs[4].id,
        applicantId: u4.id,
        message: 'Técnico certificado en gas. Puedo venir el miércoles por la mañana.',
        status: ApplicationStatus.PENDIENTE,
      },
    }),
    prisma.application.create({
      data: {
        jobId: jobs[2].id,
        applicantId: u3.id,
        message: 'Amplia experiencia en branding para hostelería. Te envío mi portfolio por email.',
        status: ApplicationStatus.RECHAZADA,
      },
    }),
    prisma.application.create({
      data: {
        jobId: jobs[7].id,
        applicantId: u4.id,
        message: 'Polivalente con 10 años de experiencia. Contrato mensual cerrado.',
        status: ApplicationStatus.PENDIENTE,
      },
    }),
  ]);

  console.log('✅ Applications creadas');

  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: u1.id,
        type: NotificationType.NEW_APPLICATION,
        title: 'Nueva postulación',
        message: 'Carlos Pérez se ha postulado a tu trabajo "Desarrollar landing page para startup".',
        relatedJobId: jobs[0].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: u3.id,
        type: NotificationType.APPLICATION_ACCEPTED,
        title: '¡Postulación aceptada!',
        message: 'Tu postulación a "Desarrollar landing page para startup" ha sido aceptada.',
        relatedJobId: jobs[0].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: u3.id,
        type: NotificationType.APPLICATION_REJECTED,
        title: 'Postulación rechazada',
        message: 'Tu postulación a "Diseño de logotipo para restaurante" ha sido rechazada.',
        relatedJobId: jobs[2].id,
      },
    }),
  ]);

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
