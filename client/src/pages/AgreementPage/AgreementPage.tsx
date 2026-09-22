import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import PageBackground from '@client/src/components/PageBackground';

const userAgreementContent = {
  title: '用户协议',
  icon: FileText,
  sections: [
    {
      heading: '一、服务内容',
      paragraphs: [
        '微迹是一款个人健康记录应用，为用户提供睡眠、情绪、病痛、饮食、运动、喝水、用药、排便等健康维度的记录、统计分析与目标管理服务。',
        '本服务仅供个人健康记录和参考使用，不构成任何医疗建议、诊断或治疗方案。如有健康问题，请及时咨询专业医疗机构。',
      ],
    },
    {
      heading: '二、账号注册与使用',
      paragraphs: [
        '用户在注册时需提供真实、准确、完整的个人信息，并对账号下的所有行为和内容负责。',
        '用户应妥善保管账号和密码，不得转借、转让或与他人共用。因用户自身原因导致的账号被盗或信息泄露，由用户自行承担责任。',
        '用户如发现账号异常使用，应立即通知微迹客服。',
      ],
    },
    {
      heading: '三、用户责任',
      paragraphs: [
        '用户应遵守国家法律法规，不得利用本服务从事任何违法违规活动。',
        '用户不得上传、传播含有违法、暴力、色情、虚假信息或侵犯他人合法权益的内容。',
        '用户不得对本服务进行反向工程、反编译、破解或其他损害系统安全的行为。',
      ],
    },
    {
      heading: '四、数据所有权',
      paragraphs: [
        '用户对其录入的健康记录数据拥有所有权。未经用户明确同意，微迹不会将用户的健康数据提供给任何第三方。',
        '用户可随时导出或删除自己的健康数据。账号注销后，相关数据将按照隐私政策的约定进行处理。',
      ],
    },
    {
      heading: '五、服务变更与中断',
      paragraphs: [
        '微迹保留随时修改、暂停或终止部分或全部服务的权利，但会提前通过合理方式通知用户。',
        '因不可抗力、系统维护、网络故障等原因导致服务中断的，微迹不承担责任，但会尽力恢复服务。',
      ],
    },
    {
      heading: '六、免责声明',
      paragraphs: [
        '本服务提供的健康记录、统计分析、目标建议等内容仅供参考，不替代专业医疗诊断和治疗。',
        '用户因使用本服务所产生的任何健康决策，应自行承担风险和后果。',
        '在法律允许的最大范围内，微迹对因使用或无法使用本服务而导致的任何直接或间接损失不承担责任。',
      ],
    },
    {
      heading: '七、协议修改',
      paragraphs: [
        '微迹可能会根据法律法规变化或业务需要修改本协议。修改后的协议将在应用内公布，继续使用服务即视为同意修改后的协议。',
      ],
    },
    {
      heading: '八、联系方式',
      paragraphs: [
        '如有任何问题或建议，欢迎通过应用内反馈功能与我们联系。',
      ],
    },
  ],
};

const privacyPolicyContent = {
  title: '隐私政策',
  icon: ShieldCheck,
  sections: [
    {
      heading: '一、引言',
      paragraphs: [
        '微迹（以下简称"我们"）非常重视用户的隐私和个人信息保护。本隐私政策将帮助您了解我们如何收集、使用、存储和保护您的个人信息。',
        '请您在使用我们的服务前，仔细阅读并充分理解本政策。您使用微迹服务，即表示您同意我们按照本政策的约定处理您的个人信息。',
      ],
    },
    {
      heading: '二、我们收集的信息',
      paragraphs: [
        '账号信息：包括用户名、密码（加密存储）等注册时提供的信息。',
        '健康数据：您主动录入的睡眠、情绪、病痛、饮食、运动、喝水、用药、排便等健康记录信息，以及相关的备注、图片、标签等内容。',
        '目标与提醒设置：您设置的健康目标、提醒配置等偏好信息。',
        '设备与日志信息：为保障服务正常运行，我们可能会收集设备型号、系统版本、应用版本、错误日志等技术信息。',
      ],
    },
    {
      heading: '三、健康数据的特殊说明',
      paragraphs: [
        '您的健康数据属于敏感个人信息，我们将采取严格的保护措施。',
        '健康数据仅用于向您提供记录、统计、分析、提醒等服务功能，不会用于任何商业营销目的。',
        '未经您的明确同意，我们不会将您的健康数据提供给任何第三方。',
        '您可以随时在应用内查看、导出或删除您的健康数据。',
      ],
    },
    {
      heading: '四、信息的使用方式',
      paragraphs: [
        '提供和维护服务：使用您的信息实现健康记录、统计分析、目标管理、提醒通知等核心功能。',
        '改善服务质量：基于匿名化、聚合化的数据分析，优化产品功能和用户体验。',
        '安全保障：用于账号安全验证、异常行为检测、防止欺诈和滥用。',
        '合规要求：响应法律法规要求或有权机关的合法请求。',
      ],
    },
    {
      heading: '五、信息的存储与保护',
      paragraphs: [
        '我们采用业界标准的安全技术和管理措施保护您的个人信息，包括加密存储、访问控制、安全审计等。',
        '密码采用不可逆加密方式存储，即使我们也无法获取您的原始密码。',
        '您的数据存储在符合国家数据安全标准的服务器上，仅限授权人员访问。',
        '我们会采取合理措施保护您的信息安全，但请注意互联网环境并非百分之百安全。',
      ],
    },
    {
      heading: '六、信息共享',
      paragraphs: [
        '我们不会向第三方出售、出租或交易您的个人信息。',
        '仅在以下情况下，我们可能会共享您的信息：（1）事先获得您的明确同意；（2）法律法规要求或有权机关依法要求；（3）为保护我们或用户的合法权益所必需。',
      ],
    },
    {
      heading: '七、您的权利',
      paragraphs: [
        '访问权：您可以随时查看您的个人信息和健康记录。',
        '更正权：您可以修改您的账号信息和健康记录。',
        '删除权：您可以删除单条记录，也可以注销账号并删除全部数据。',
        '导出权：您可以导出您的健康数据。',
        '撤回同意：您可以通过注销账号的方式撤回对个人信息处理的同意。',
      ],
    },
    {
      heading: '八、未成年人保护',
      paragraphs: [
        '若您是未满18周岁的未成年人，请在监护人的指导下使用本服务。',
        '我们非常重视未成年人的信息保护，将严格按照相关法律法规处理未成年人的个人信息。',
      ],
    },
    {
      heading: '九、政策更新',
      paragraphs: [
        '我们可能会适时更新本隐私政策。更新后将在应用内公布，重大变更会通过更显著的方式通知您。',
      ],
    },
    {
      heading: '十、联系我们',
      paragraphs: [
        '如您对本隐私政策或个人信息保护有任何疑问、意见或建议，请通过应用内反馈功能与我们联系。',
      ],
    },
  ],
};

export default function AgreementPage() {
  const { type } = useParams<{ type: string }>();
  const content = type === 'privacy' ? privacyPolicyContent : userAgreementContent;
  const Icon = content.icon;

  return (
    <div className="min-h-screen relative">
      <PageBackground />
      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10 page-content-wrap">
        <Link
          to=".."
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          返回
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Icon size={20} />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{content.title}</h1>
        </div>

        <div className="space-y-6">
          {content.sections.map((section) => (
            <section key={section.heading} className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">{section.heading}</h2>
              <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                {section.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border/50 text-xs text-muted-foreground">
          最后更新日期：2026年9月
        </div>
      </div>
    </div>
  );
}
