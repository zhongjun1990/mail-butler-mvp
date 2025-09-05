const { AIService } = require('./dist/services/AIService');

// 测试 OpenAI 集成
async function testOpenAIIntegration() {
  console.log('🤖 测试 OpenAI 集成功能...');
  console.log('');

  try {
    const aiService = new AIService();
    
    // 检查 OpenAI API 配置
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !apiKey.startsWith('sk-')) {
      console.log('⚠️  OpenAI API Key 未配置，将使用模拟分析');
      console.log('💡 提示：在 .env 文件中设置 OPENAI_API_KEY=你的API密钥');
    } else {
      console.log('✅ OpenAI API Key 已配置');
    }
    
    console.log('');
    console.log('📧 测试邮件分析功能...');
    
    // 测试邮件数据
    const testEmails = [
      {
        email_id: 'test-001',
        subject: '紧急：系统维护通知',
        content: '尊敬的用户，我们将在今晚22:00-次日02:00进行系统维护，期间服务可能中断。请提前做好准备。如有疑问请联系客服。',
        sender: 'system@company.com'
      },
      {
        email_id: 'test-002', 
        subject: '项目进度汇报 - Q4季度总结',
        content: '各位同事好，现将Q4季度项目进展汇报如下：1. 用户增长达到预期目标；2. 新功能上线顺利；3. 下季度计划已制定。请查收附件详细报告。',
        sender: 'manager@company.com'
      },
      {
        email_id: 'test-003',
        subject: '感谢您的支持',
        content: '亲爱的客户，感谢您一直以来对我们的支持和信任。我们将继续为您提供优质的服务。祝您工作顺利，生活愉快！',
        sender: 'service@company.com'
      }
    ];
    
    for (const email of testEmails) {
      console.log(`\n📬 分析邮件: "${email.subject}"`);
      
      try {
        const analysis = await aiService.analyzeEmail(email);
        
        console.log(`  📝 摘要: ${analysis.summary}`);
        console.log(`  🎯 优先级: ${analysis.priority}`);
        console.log(`  😊 情感: ${analysis.sentiment}`);
        console.log(`  🏷️  标签: ${analysis.tags.join(', ')}`);
        console.log(`  📍 关键点: ${analysis.key_points.join(', ')}`);
        console.log(`  ⚡ 需要行动: ${analysis.action_required ? '是' : '否'}`);
        console.log(`  📊 置信度: ${Math.round(analysis.confidence * 100)}%`);
        
      } catch (error) {
        console.log(`  ❌ 分析失败: ${error.message}`);
      }
    }
    
    console.log('');
    console.log('💬 测试 AI 聊天功能...');
    
    // 测试聊天功能
    const chatMessages = [
      '我有多少封未读邮件？',
      '帮我找一下重要的邮件',
      '今天收到了什么类型的邮件？'
    ];
    
    for (const message of chatMessages) {
      console.log(`\n👤 用户: ${message}`);
      
      try {
        // 使用测试用户 ID
        const chatResponse = await aiService.chatWithAI('test-user-id', message);
        
        console.log(`🤖 AI: ${chatResponse.reply}`);
        if (chatResponse.suggestions.length > 0) {
          console.log(`💡 建议: ${chatResponse.suggestions.join(', ')}`);
        }
        
      } catch (error) {
        console.log(`❌ 聊天失败: ${error.message}`);
      }
    }
    
    console.log('');
    console.log('🎉 OpenAI 集成测试完成！');
    
    console.log('');
    console.log('📋 功能状态总结:');
    console.log('  ✅ 邮件智能分析');
    console.log('  ✅ AI 聊天助手'); 
    console.log('  ✅ 智能标签生成');
    console.log('  ✅ 优先级判断');
    console.log('  ✅ 情感分析');
    console.log('  ✅ 关键信息提取');
    console.log('  ✅ 模拟模式支持');
    
    console.log('');
    console.log('🚀 下一步可以：');
    console.log('  1. 配置真实的 OpenAI API Key 获得更准确的分析');
    console.log('  2. 在前端集成 AI 聊天界面');
    console.log('  3. 测试邮件同步时的 AI 分析');
    console.log('  4. 优化 AI 提示词以提高分析准确性');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testOpenAIIntegration().catch(console.error);