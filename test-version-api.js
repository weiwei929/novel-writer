// 版本管理API测试脚本
const API_BASE = 'http://localhost:5000/api/v1'

// 测试项目数据
const TEST_PROJECT_ID = 'test-novel-project'
const TEST_COLLECTION_ID = 'test-collection'

// 测试辅助函数
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        })
        
        const data = await response.json()
        console.log(`📡 ${options.method || 'GET'} ${url}`)
        console.log(`📊 Status: ${response.status}`)
        console.log(`📄 Response:`, data)
        console.log('─'.repeat(80))
        return data
    } catch (error) {
        console.error(`❌ API调用失败:`, error.message)
        return { success: false, error: error.message }
    }
}

// 测试步骤
async function runVersionManagementTests() {
    console.log('🚀 开始版本管理API测试')
    console.log('═'.repeat(80))

    try {
        // 1. 创建测试集合
        console.log('📁 步骤1: 创建测试集合')
        const collectionResult = await apiCall(`${API_BASE}/collections`, {
            method: 'POST',
            body: JSON.stringify({
                id: TEST_COLLECTION_ID,
                name: '版本管理测试集合',
                description: '用于测试版本管理功能的集合'
            })
        })

        // 2. 创建测试项目
        console.log('📖 步骤2: 创建测试项目')
        const projectResult = await apiCall(`${API_BASE}/projects`, {
            method: 'POST',
            body: JSON.stringify({
                id: TEST_PROJECT_ID,
                collectionId: TEST_COLLECTION_ID,
                title: '版本管理测试小说',
                description: '用于测试版本管理功能的测试小说',
                author: '测试作者',
                genre: ['测试'],
                tags: ['版本测试']
            })
        })

        // 3. 创建测试章节
        console.log('📝 步骤3: 创建测试章节')
        const chapterResult = await apiCall(`${API_BASE}/chapters`, {
            method: 'POST',
            body: JSON.stringify({
                projectId: TEST_PROJECT_ID,
                title: '第一章：开始',
                content: '这是一个测试章节。\n\n小明走在街上，思考着人生的意义。突然，他发现了一个奇怪的现象...',
                order: 1
            })
        })

        // 等待一秒，确保项目创建完成
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 4. 创建第一个版本 - 手动保存
        console.log('💾 步骤4: 创建手动保存版本')
        const version1 = await apiCall(`${API_BASE}/versions/${TEST_PROJECT_ID}`, {
            method: 'POST',
            body: JSON.stringify({
                type: 'manual',
                title: '初始版本',
                description: '项目的第一个手动保存版本',
                tags: ['初始', '手动']
            })
        })

        // 5. 修改章节内容
        console.log('✏️ 步骤5: 修改章节内容')
        if (chapterResult.success && chapterResult.data) {
            await apiCall(`${API_BASE}/chapters/${chapterResult.data.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    content: '这是一个测试章节。\n\n小明走在街上，思考着人生的意义。突然，他发现了一个奇怪的现象...\n\n他看到了一只会说话的猫！这只猫告诉他一个惊人的秘密。'
                })
            })
        }

        // 6. 创建里程碑版本
        console.log('🏆 步骤6: 创建里程碑版本')
        const version2 = await apiCall(`${API_BASE}/versions/${TEST_PROJECT_ID}`, {
            method: 'POST',
            body: JSON.stringify({
                type: 'milestone',
                title: '第一章完成',
                description: '完成第一章的写作，添加了重要剧情',
                tags: ['里程碑', '第一章']
            })
        })

        // 7. 获取版本列表
        console.log('📋 步骤7: 获取版本列表')
        const versionList = await apiCall(`${API_BASE}/versions/${TEST_PROJECT_ID}?page=1&limit=10`)

        // 8. 获取版本详情
        if (version1.success && version1.version) {
            console.log('🔍 步骤8: 获取版本详情')
            const versionDetail = await apiCall(`${API_BASE}/versions/${TEST_PROJECT_ID}/${version1.version.id}`)
        }

        // 9. 版本比较
        if (version1.success && version2.success && version1.version && version2.version) {
            console.log('🔄 步骤9: 版本比较')
            const comparison = await apiCall(`${API_BASE}/versions/${TEST_PROJECT_ID}/compare`, {
                method: 'POST',
                body: JSON.stringify({
                    sourceVersionId: version1.version.id,
                    targetVersionId: version2.version.id
                })
            })
        }

        // 10. 获取版本统计
        console.log('📊 步骤10: 获取版本统计')
        const statistics = await apiCall(`${API_BASE}/versions/${TEST_PROJECT_ID}/statistics`)

        // 11. 创建快照版本
        console.log('📸 步骤11: 创建快照版本')
        const version3 = await apiCall(`${API_BASE}/versions/${TEST_PROJECT_ID}`, {
            method: 'POST',
            body: JSON.stringify({
                type: 'snapshot',
                title: '实验性修改前快照',
                description: '准备进行实验性修改前的快照备份',
                tags: ['快照', '实验']
            })
        })

        // 12. 更新版本信息
        if (version3.success && version3.version) {
            console.log('📝 步骤12: 更新版本信息')
            const updateResult = await apiCall(`${API_BASE}/versions/${TEST_PROJECT_ID}/${version3.version.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title: '实验性修改前快照 (已更新)',
                    description: '准备进行实验性修改前的快照备份 - 已更新描述',
                    tags: ['快照', '实验', '已更新']
                })
            })
        }

        console.log('✅ 版本管理API测试完成！')
        console.log('═'.repeat(80))

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error)
    }
}

// 执行测试
runVersionManagementTests()