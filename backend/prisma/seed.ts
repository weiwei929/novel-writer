import { prisma } from '../src/utils/db'

async function main() {
  console.log('🌱 Starting seeding...')

  // 1. Create a Default Collection
  const collection = await prisma.collection.create({
    data: {
      name: '我的文集 (Default)',
      description: '存放我的所有精彩故事',
    }
  })

  // 2. Create a Demo Project
  const project = await prisma.project.create({
    data: {
      title: '示例小说：星际穿越',
      description: '一个关于孤独宇航员的史诗故事。',
      author: 'Admin',
      status: 'writing',
      collectionId: collection.id,
      wordCount: 1000,
    }
  })

  // 3. Create Chapters
  await prisma.chapter.create({
    data: {
      title: '第一章：启航',
      order: 1,
      content: '# 第一章：启航\n\n引擎的轰鸣声震耳欲聋。约翰深吸了一口气，按下了发射按钮。\n\n"再见了，地球。"',
      wordCount: 50,
      projectId: project.id,
      status: 'completed'
    }
  })

  await prisma.chapter.create({
    data: {
      title: '第二章：静默',
      order: 2,
      content: '# 第二章：静默\n\n太空中是一片死寂。只有仪表盘的呼吸灯在闪烁。',
      wordCount: 30,
      projectId: project.id,
      status: 'writing'
    }
  })

  // 4. Create a Scrap (Deleted Scene)
  await prisma.scrap.create({
    data: {
      content: '约翰本来想带上他的猫，但是宇航局规定严禁携带宠物。他只好把那张照片贴在驾驶舱玻璃上。',
      note: '这段太温情了，不符合硬科幻基调，先删了。',
      tags: 'deleted_scene,character_detail',
      projectId: project.id
    }
  })

  // 5. Create a Character
  await prisma.character.create({
    data: {
      name: '约翰·多伊',
      role: '主角',
      description: '一名经验丰富但内心孤独的宇航员。',
      projectId: project.id
    }
  })

  console.log('✅ Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
