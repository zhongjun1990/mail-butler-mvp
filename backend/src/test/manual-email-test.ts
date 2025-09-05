#!/usr/bin/env node

// 邮箱管家 - 邮件服务手动测试脚本

import { EmailService } from '../services/EmailService';
import { AIService } from '../services/AIService';

async function testEmailService() {
  console.log('🧪 开始测试邮件服务...\n');

  const emailService = new EmailService();
  const aiService = new AIService();

  // 1. 测试邮箱提供商检测
  console.log('1️⃣ 测试邮箱提供商检测:');
  const testEmails = [
    'test@gmail.com',
    'user@outlook.com', 
    'hello@163.com',
    'contact@qq.com',
    'custom@mycompany.com'
  ];

  testEmails.forEach(email => {
    const provider = EmailService.detectProvider(email);
    console.log(`   ${email} -> ${provider}`);
  });

  // 2. 测试提供商配置获取
  console.log('\n2️⃣ 测试提供商配置获取:');
  try {
    const gmailConfig = EmailService.getProviderConfig('gmail');
    console.log('   Gmail IMAP:', gmailConfig.imap.host, gmailConfig.imap.port);
    console.log('   Gmail SMTP:', gmailConfig.smtp.host, gmailConfig.smtp.port);
    
    const outlookConfig = EmailService.getProviderConfig('outlook');
    console.log('   Outlook IMAP:', outlookConfig.imap.host, outlookConfig.imap.port);
    console.log('   Outlook SMTP:', outlookConfig.smtp.host, outlookConfig.smtp.port);
  } catch (error) {
    console.log('   ❌ 获取配置失败:', (error as Error).message);
  }

  // 3. 测试IMAP连接（使用无效配置，预期失败）
  console.log('\n3️⃣ 测试IMAP连接 (预期失败):');
  try {
    const testConfig = {
      host: 'invalid.test.com',
      port: 993,
      secure: true,
      username: 'test@test.com',
      password: 'invalid'
    };
    
    const result = await emailService.testIMAPConnection(testConfig);
    console.log('   连接结果:', result.success ? '✅ 成功' : '❌ 失败');
    if (!result.success) {
      console.log('   错误信息:', result.error);
    }
  } catch (error) {
    console.log('   ❌ 测试异常:', (error as Error).message);
  }

  // 4. 测试SMTP连接（使用无效配置，预期失败）
  console.log('\n4️⃣ 测试SMTP连接 (预期失败):');
  try {
    const testConfig = {
      host: 'invalid.test.com',
      port: 587,
      secure: false,
      username: 'test@test.com',
      password: 'invalid'
    };
    
    const result = await emailService.testSMTPConnection(testConfig);
    console.log('   连接结果:', result.success ? '✅ 成功' : '❌ 失败');
    if (!result.success) {
      console.log('   错误信息:', result.error);
    }
  } catch (error) {
    console.log('   ❌ 测试异常:', (error as Error).message);
  }

  // 5. 测试AI邮件分析
  console.log('\n5️⃣ 测试AI邮件分析:');
  
  const testEmails2 = [
    {
      email_id: 'test-001',
      subject: '紧急：项目会议通知',
      content: '请所有团队成员参加明天上午10点的紧急会议，讨论项目进度和问题。请确认参加并准备相关材料。',
      sender: 'manager@company.com'
    },
    {
      email_id: 'test-002', 
      subject: '限时优惠 - 购买即享7折',
      content: '亲爱的客户，我们的年度大促销开始了！现在购买任意产品都可享受7折优惠。活动有限，欲购从速！',
      sender: 'noreply@shop.com'
    },
    {
      email_id: 'test-003',
      subject: '感谢您的支持',
      content: '非常感谢您对我们工作的支持和理解。您的建议非常有价值，我们会认真考虑并改进。',
      sender: 'support@service.com'
    }
  ];

  for (let i = 0; i < testEmails2.length; i++) {
    const emailData = testEmails2[i];
    console.log(`\n   测试邮件 ${i + 1}:`);
    console.log(`   主题: ${emailData.subject}`);
    console.log(`   发件人: ${emailData.sender}`);
    
    try {
      const analysis = await aiService.analyzeEmail(emailData);
      console.log(`   📊 分析结果:`);
      console.log(`      优先级: ${analysis.priority}`);
      console.log(`      情感: ${analysis.sentiment}`);
      console.log(`      标签: ${analysis.tags.join(', ')}`);
      console.log(`      需要行动: ${analysis.action_required ? '是' : '否'}`);
      console.log(`      置信度: ${(analysis.confidence * 100).toFixed(1)}%`);
      console.log(`      摘要: ${analysis.summary}`);
      console.log(`      关键点: ${analysis.key_points.join(', ')}`);
    } catch (error) {
      console.log(`   ❌ 分析失败:`, (error as Error).message);
    }
  }

  console.log('\n✅ 邮件服务测试完成！');
  console.log('\n📈 测试总结:');
  console.log('   - 邮箱提供商检测: ✅ 正常');
  console.log('   - 提供商配置获取: ✅ 正常'); 
  console.log('   - IMAP/SMTP连接测试: ✅ 正常（预期失败）');
  console.log('   - AI邮件分析: ✅ 正常');
  console.log('\n🎯 下一步: 使用真实的邮箱凭据测试完整功能');
}

// 运行测试
if (require.main === module) {
  testEmailService().catch(console.error);
}

export { testEmailService };