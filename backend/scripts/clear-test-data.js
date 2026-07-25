const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('开始清理测试数据...');
  await prisma.chapter.deleteMany({});
  await prisma.character.deleteMany({});
  await prisma.timelineEntry.deleteMany({});
  await prisma.creativeFlow.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.scrap.deleteMany({});
  await prisma.fileReference.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.proposal.deleteMany({});
  await prisma.collection.deleteMany({});
  console.log('测试数据清理完成！数据库已回到初始纯净状态。');
}

main()
  .catch(e => {
    console.error('清理测试数据失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
