import React, { useEffect } from 'react';
import './Terms.css';

const Privacy = ({ onBack, language = 'en' }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated: February 2026',
      sections: [
        {
          title: '1. Information We Collect',
          content: `We collect the following information when you use the Your Kanji Name service:

• Your name (to create your personalized kanji name)
• Email address (to deliver your calligraphy artwork)
• Responses to personality questions (to generate your kanji name)
• Payment information (processed securely by Stripe; not stored on our servers)
• Partner referral codes (if you accessed the service through a partner)`
        },
        {
          title: '2. How We Use Your Information',
          content: `Your information is used for the following purposes:

• Creating your personalized kanji name based on your responses
• Delivering your calligraphy artwork to your email address
• Processing your payment through Stripe
• Tracking partner referrals for royalty payments
• Improving our service quality`
        },
        {
          title: '3. Information Sharing',
          content: `• We do not sell your personal information to third parties
• We share your email and kanji name with our calligrapher solely for the purpose of creating and delivering your artwork
• Payment data is processed by Stripe Inc. in accordance with their privacy policy
• Partner stores receive only aggregated, anonymized sales data for royalty calculation purposes
• We may disclose information when required by law`
        },
        {
          title: '4. Data Security',
          content: `• All data transmission is encrypted using SSL/TLS
• Payment information is handled by Stripe and never stored on our servers
• We implement appropriate technical and organizational measures to protect your personal data
• Access to personal information is restricted to authorized personnel only`
        },
        {
          title: '5. Data Retention',
          content: `• Your question responses are retained only for the duration needed to generate your kanji name
• Email addresses and order records are retained for service delivery and customer support purposes
• You may request deletion of your personal data at any time by contacting us`
        },
        {
          title: '6. Your Rights',
          content: `You have the following rights regarding your personal data:

• Right to access your personal information
• Right to correct inaccurate information
• Right to request deletion of your data
• Right to object to processing of your data
• Right to data portability

To exercise these rights, please contact us at contact@kanjiname.jp`
        },
        {
          title: '7. Cookies and Tracking',
          content: `• We use session storage to track partner referral codes during your visit
• We do not use third-party tracking cookies for advertising purposes
• Stripe may use cookies as part of payment processing`
        },
        {
          title: '8. Children\'s Privacy',
          content: `Our service is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13.`
        },
        {
          title: '9. Changes to This Policy',
          content: `We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. Continued use of the service after changes constitutes acceptance of the updated policy.`
        },
        {
          title: '10. Governing Law',
          content: `This Privacy Policy is governed by and construed in accordance with the laws of Japan. Any disputes shall be subject to the exclusive jurisdiction of the Hiroshima District Court.`
        },
        {
          title: '11. Contact',
          content: `For questions or concerns about this Privacy Policy, please contact us at:

contact@kanjiname.jp`
        }
      ],
      backButton: 'Back'
    },
    ja: {
      title: 'プライバシーポリシー',
      lastUpdated: '最終更新日: 2026年2月',
      sections: [
        {
          title: '1. 収集する情報',
          content: `Your Kanji Nameサービスのご利用にあたり、以下の情報を収集します。

• お名前（漢字名の作成に使用）
• メールアドレス（書道作品のお届けに使用）
• 性格診断の回答（漢字名の生成に使用）
• 決済情報（Stripeを通じて安全に処理され、当社サーバーには保存されません）
• パートナー紹介コード（パートナー経由でアクセスされた場合）`
        },
        {
          title: '2. 情報の利用目的',
          content: `お客様の情報は、以下の目的で利用します。

• 回答に基づくオリジナル漢字名の作成
• メールアドレスへの書道作品のお届け
• Stripeを通じた決済処理
• パートナーへのロイヤリティ計算のための紹介追跡
• サービス品質の向上`
        },
        {
          title: '3. 情報の共有',
          content: `• 個人情報を第三者に販売することはありません
• 書道作品の制作・お届けのため、メールアドレスと漢字名を書道家と共有します
• 決済データはStripe Inc.のプライバシーポリシーに従って処理されます
• パートナー店舗には、ロイヤリティ計算のために匿名化された集計売上データのみを提供します
• 法令に基づく場合、情報を開示することがあります`
        },
        {
          title: '4. データの安全管理',
          content: `• すべてのデータ通信はSSL/TLSにより暗号化されています
• 決済情報はStripeが処理し、当社サーバーには保存されません
• 個人データの保護のため、適切な技術的・組織的措置を講じています
• 個人情報へのアクセスは、権限を有する担当者のみに制限されています`
        },
        {
          title: '5. データの保存期間',
          content: `• 質問の回答は、漢字名の生成に必要な期間のみ保持します
• メールアドレスおよび注文記録は、サービス提供およびカスタマーサポートのために保持します
• お客様はいつでも個人データの削除を請求することができます`
        },
        {
          title: '6. お客様の権利',
          content: `お客様は、ご自身の個人データについて以下の権利を有します。

• 個人情報へのアクセス権
• 不正確な情報の訂正権
• データの削除請求権
• データ処理に対する異議申立権
• データポータビリティの権利

これらの権利を行使される場合は、contact@kanjiname.jp までご連絡ください。`
        },
        {
          title: '7. Cookieおよびトラッキング',
          content: `• パートナー紹介コードの追跡にセッションストレージを使用しています
• 広告目的のサードパーティトラッキングCookieは使用していません
• Stripeが決済処理の一環としてCookieを使用する場合があります`
        },
        {
          title: '8. お子様のプライバシー',
          content: `当サービスは13歳未満のお子様を対象としていません。13歳未満のお子様から故意に個人情報を収集することはありません。`
        },
        {
          title: '9. ポリシーの変更',
          content: `本プライバシーポリシーは随時更新される場合があります。変更はこのページに更新日とともに掲載されます。変更後のサービス利用の継続は、更新されたポリシーへの同意とみなされます。`
        },
        {
          title: '10. 準拠法',
          content: `本プライバシーポリシーは日本法に準拠し、日本法に従って解釈されます。紛争が生じた場合は、広島地方裁判所を第一審の専属的合意管轄裁判所とします。`
        },
        {
          title: '11. お問い合わせ',
          content: `本プライバシーポリシーに関するご質問やご懸念は、下記までお問い合わせください。

contact@kanjiname.jp`
        }
      ],
      backButton: '戻る'
    }
  };

  const t = content[language] || content.en;

  return (
    <div className="terms-container">
      <div className="terms-content">
        <h1>{t.title}</h1>
        <p className="terms-updated">{t.lastUpdated}</p>

        {t.sections.map((section, index) => (
          <div key={index} className="terms-section">
            <h2>{section.title}</h2>
            <p>{section.content}</p>
          </div>
        ))}

        {onBack && (
          <button className="terms-back-btn" onClick={onBack}>
            {t.backButton}
          </button>
        )}
      </div>
    </div>
  );
};

export default Privacy;
