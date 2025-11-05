// Novel-Writer API 测试脚本
// 用于验证后端API的基本功能

const axios = require('axios')

const API_BASE_URL = 'http://localhost:5000/api/v1'
const HEALTH_URL = 'http://localhost:5000/health'

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[37m${text}\x1b[0m`
}

// 测试结果收集
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
}

// 测试辅助函数
function test(description, testFn) {
  results.total++
  console.log(`\n${colors.yellow('◯')} ${description}`)
  
  return testFn()
    .then(() => {
      results.passed++
      console.log(`  ${colors.green('✓')} 通过`)
    })
    .catch(error => {
      results.failed++
      const errorMsg = error.response?.data?.message || error.message || String(error)
      const statusCode = error.response?.status || 'N/A'
      const fullError = `Status: ${statusCode}, Message: ${errorMsg}`
      results.errors.push({ test: description, error: fullError })
      console.log(`  ${colors.red('✗')} 失败: ${fullError}`)
    })
}

// 验证ApiResponse格式
function validateApiResponse(response, expectData = true) {
  if (!response.data) {
    throw new Error('响应数据为空')
  }
  
  const { success, data, error, metadata } = response.data
  
  if (typeof success !== 'boolean') {
    throw new Error('缺少success字段或类型错误')
  }
  
  if (expectData && success && !data) {
    throw new Error('成功响应缺少data字段')
  }
  
  if (!success && !error) {
    throw new Error('错误响应缺少error字段')
  }
  
  if (metadata && !metadata.timestamp) {
    throw new Error('metadata缺少timestamp字段')
  }
  
  return response.data
}

// 主测试函数
async function runTests() {
  console.log(colors.cyan('小说创作器 API 测试'))
  console.log(colors.cyan('===================='))
  
  // 健康检查测试
  await test('健康检查端点', async () => {
    try {
      console.log(`  尝试连接到: ${HEALTH_URL}`)
      const response = await axios.get(HEALTH_URL, { timeout: 5000 })
      console.log(`  响应状态: ${response.status}`)
      console.log(`  响应数据: ${JSON.stringify(response.data)}`)
      if (response.data.status !== 'ok') {
        throw new Error('健康检查失败')
      }
    } catch (error) {
      console.log(`  连接错误详情: ${error.code} - ${error.message}`)
      if (error.response) {
        console.log(`  HTTP状态: ${error.response.status}`)
      }
      throw error
    }
  })
  
  // API健康检查测试
  await test('API健康检查端点', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 })
    if (response.data.status !== 'ok') {
      throw new Error('API健康检查失败')
    }
  })
  
  // 文集API测试
  let testCollectionId = null
  
  await test('获取文集列表', async () => {
    const response = await axios.get(`${API_BASE_URL}/collections`)
    const apiResponse = validateApiResponse(response)
    if (!Array.isArray(apiResponse.data)) {
      throw new Error('文集列表不是数组格式')
    }
  })
  
  await test('创建测试文集', async () => {
    const testCollection = {
      name: 'API测试文集',
      description: '用于API测试的临时文集',
      tags: ['测试']
    }
    
    const response = await axios.post(`${API_BASE_URL}/collections`, testCollection)
    const apiResponse = validateApiResponse(response)
    
    if (!apiResponse.data.id || !apiResponse.data.name) {
      throw new Error('创建的文集数据不完整')
    }
    
    testCollectionId = apiResponse.data.id
  })
  
  // 项目API测试
  let testProjectId = null
  
  if (testCollectionId) {
    await test('创建测试项目', async () => {
      const testProject = {
        title: 'API测试项目',
        description: '用于API测试的临时项目',
        author: '测试作者',
        genre: ['测试'],
        tags: ['API测试'],
        collectionId: testCollectionId
      }
      
      const response = await axios.post(`${API_BASE_URL}/projects`, testProject)
      const apiResponse = validateApiResponse(response)
      
      if (!apiResponse.data.id || !apiResponse.data.title) {
        throw new Error('创建的项目数据不完整')
      }
      
      testProjectId = apiResponse.data.id
    })
    
    await test('获取项目列表', async () => {
      const response = await axios.get(`${API_BASE_URL}/projects`)
      const apiResponse = validateApiResponse(response)
      
      if (!Array.isArray(apiResponse.data)) {
        throw new Error('项目列表不是数组格式')
      }
    })
  }
  
  // 章节API测试  
  let testChapterId = null
  
  if (testProjectId) {
    await test('RESTful章节API - 获取项目章节', async () => {
      const response = await axios.get(`${API_BASE_URL}/projects/${testProjectId}/chapters`)
      const apiResponse = validateApiResponse(response)
      
      if (!Array.isArray(apiResponse.data)) {
        throw new Error('章节列表不是数组格式')
      }
    })
    
    await test('RESTful章节API - 创建章节', async () => {
      const testChapter = {
        title: 'API测试章节',
        content: '这是API测试创建的章节内容',
        order: 1
      }
      
      const response = await axios.post(`${API_BASE_URL}/projects/${testProjectId}/chapters`, testChapter)
      const apiResponse = validateApiResponse(response)
      
      if (!apiResponse.data.id || !apiResponse.data.title) {
        throw new Error('创建的章节数据不完整')
      }
      
      testChapterId = apiResponse.data.id
    })
    
    await test('向后兼容章节API - 获取章节', async () => {
      const response = await axios.get(`${API_BASE_URL}/chapters?projectId=${testProjectId}`)
      const apiResponse = validateApiResponse(response)
      
      if (!Array.isArray(apiResponse.data)) {
        throw new Error('章节列表不是数组格式')
      }
    })
  }
  
  // 错误处理测试
  await test('404错误处理', async () => {
    try {
      await axios.get(`${API_BASE_URL}/nonexistent`)
      throw new Error('应该返回404错误')
    } catch (error) {
      if (error.response && error.response.status === 404) {
        const apiResponse = error.response.data
        if (!apiResponse.error || !apiResponse.error.code) {
          throw new Error('404错误响应格式不正确')
        }
      } else {
        throw error
      }
    }
  })
  
  await test('参数验证错误处理', async () => {
    try {
      await axios.get(`${API_BASE_URL}/chapters`)  // 缺少projectId参数
      throw new Error('应该返回参数错误')
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const apiResponse = error.response.data
        if (!apiResponse.error || apiResponse.error.code !== 'VALIDATION_ERROR') {
          throw new Error('参数错误响应格式不正确')
        }
      } else {
        throw error
      }
    }
  })
  
  // 清理测试数据
  if (testChapterId) {
    await test('清理测试章节', async () => {
      await axios.delete(`${API_BASE_URL}/chapters/${testChapterId}`)
    })
  }
  
  if (testProjectId) {
    await test('清理测试项目', async () => {
      await axios.delete(`${API_BASE_URL}/projects/${testProjectId}`)
    })
  }
  
  if (testCollectionId) {
    await test('清理测试文集', async () => {
      await axios.delete(`${API_BASE_URL}/collections/${testCollectionId}`)
    })
  }
  
  // 输出测试结果
  console.log('\n' + colors.cyan('测试结果汇总'))
  console.log(colors.cyan('================'))
  console.log(`总计测试: ${results.total}`)
  console.log(`${colors.green('通过')}: ${results.passed}`)
  console.log(`${colors.red('失败')}: ${results.failed}`)
  
  if (results.errors.length > 0) {
    console.log('\n' + colors.red('失败详情:'))
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}`)
      console.log(`   ${colors.gray(error.error)}`)
    })
  }
  
  if (results.failed === 0) {
    console.log('\n' + colors.green('🎉 所有测试通过! API功能正常'))
  } else {
    console.log('\n' + colors.red('❌ 部分测试失败，请检查API实现'))
    process.exit(1)
  }
}

// 执行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error(colors.red('\n测试执行出错:'), error.message)
    process.exit(1)
  })
}

module.exports = { runTests, validateApiResponse }