import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or run from the project with .env.local loaded.')
  process.exit(1)
}

const supabase = createClient(url, key)

const officialLinks = {
  Retirement: [
    ['IRS retirement plan resources', 'https://www.irs.gov/retirement-plans'],
    ['SEC Investor.gov retirement toolkit', 'https://www.investor.gov/additional-resources/retirement-toolkit'],
    ['Social Security Administration', 'https://www.ssa.gov/'],
  ],
  Credit: [
    ['CFPB credit card resources', 'https://www.consumerfinance.gov/consumer-tools/credit-cards/'],
    ['FTC credit and debt guidance', 'https://consumer.ftc.gov/credit-loans-debt'],
  ],
  Investing: [
    ['SEC Investor.gov', 'https://www.investor.gov/'],
    ['FINRA investor education', 'https://www.finra.org/investors'],
  ],
  Taxes: [
    ['IRS individuals', 'https://www.irs.gov/individuals'],
    ['IRS tax withholding estimator', 'https://www.irs.gov/individuals/tax-withholding-estimator'],
  ],
  'Real Estate': [
    ['CFPB home buying guide', 'https://www.consumerfinance.gov/owning-a-home/'],
    ['HUD homebuying resources', 'https://www.hud.gov/topics/buying_a_home'],
  ],
  'Personal Finance': [
    ['CFPB consumer finance guides', 'https://www.consumerfinance.gov/consumer-tools/'],
    ['FDIC Money Smart', 'https://www.fdic.gov/resources/consumers/money-smart/'],
  ],
}

const faqByCategory = {
  Retirement: [
    'What should beginners review before opening a retirement account?',
    'Should conservative investors avoid stocks completely?',
  ],
  Credit: [
    'Which credit card fees are easiest to avoid?',
    'How can I reduce interest charges?',
  ],
  Investing: [
    'How much investment risk is reasonable for beginners?',
    'Should beginners avoid high-risk investments completely?',
  ],
  Taxes: [
    'What records should I check first?',
    'When do tax rules change the decision?',
  ],
  'Real Estate': [
    'What costs should buyers compare first?',
    'How much risk is too much for a housing decision?',
  ],
  'Personal Finance': [
    'What should I review before changing my budget?',
    'How do I know if a money move is too risky?',
  ],
}

function escRegExp(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function titleCase(s) {
  return String(s || '').replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
}

function inferCategory(post) {
  const text = `${post.title || ''} ${post.primary_keyword || ''} ${post.category || ''}`.toLowerCase()
  if (/retirement|401k|401\(k\)|ira|social security|pension|roth|catch.?up/.test(text)) return 'Retirement'
  if (/credit|card|fico|score|balance transfer|debt/.test(text)) return 'Credit'
  if (/invest|brokerage|stock|etf|fund|portfolio/.test(text)) return 'Investing'
  if (/tax|irs|deduction|refund|withholding/.test(text)) return 'Taxes'
  if (/home|mortgage|rent|buy|real estate|closing cost/.test(text)) return 'Real Estate'
  return post.category && officialLinks[post.category] ? post.category : 'Personal Finance'
}

function sourceSentence(category) {
  const links = officialLinks[category] || officialLinks['Personal Finance']
  const linked = links.map(([title, href]) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${title}</a>`)
  if (category === 'Retirement') return `<p>Before acting, verify current retirement account rules through ${linked[0]}, ${linked[1]}, and ${linked[2]}.</p>`
  if (category === 'Credit') return `<p>For current credit card rules and consumer protections, check ${linked[0]} and ${linked[1]}.</p>`
  if (category === 'Investing') return `<p>For investor education and risk basics, review ${linked[0]} and ${linked[1]}.</p>`
  if (category === 'Taxes') return `<p>For current tax rules, check ${linked[0]} and ${linked[1]} before acting.</p>`
  if (category === 'Real Estate') return `<p>For homebuying rules and cost checklists, review ${linked[0]} and ${linked[1]}.</p>`
  return `<p>For current consumer finance guidance, review ${linked[0]} and ${linked[1]}.</p>`
}

function removeSection(html, heading) {
  const escaped = escRegExp(heading)
  return html.replace(new RegExp(`<h2>${escaped}<\\/h2>[\\s\\S]*?(?=<h2>|$)`, 'gi'), '')
}

function cleanBody(body, keyword, category) {
  let html = String(body || '')
  const kw = String(keyword || '').trim()
  const cap = titleCase(kw)
  const kwRe = escRegExp(kw)
  const capRe = escRegExp(cap)

  html = removeSection(html, 'Data and sources to verify')
  html = removeSection(html, 'Tools and accounts that can help')
  html = removeSection(html, 'Helpful official resources')

  if (kw) {
    html = html.replace(new RegExp(`<p>${capRe} is a decision area where small details can change the outcome\\. Fees, interest rates, account rules, tax treatment, deadlines, and timing can all matter\\. A strong article or plan should explain these details clearly instead of making broad promises\\.</p>`, 'gi'), '<p>Small details can change the outcome. Fees, interest rates, account rules, tax treatment, deadlines, and timing can all matter. A useful plan explains these details clearly instead of making broad promises.</p>')
    html = html.replace(new RegExp(`<h2>What ${kwRe} means</h2>`, 'gi'), '<h2>What this means</h2>')
    html = html.replace(new RegExp(`<h3>Is ${kwRe} the same for everyone\\?</h3>`, 'gi'), '<h3>Does the same advice work for everyone?</h3>')
    html = html.replace(new RegExp(`<h3>What should I check first with ${kwRe}\\?</h3>`, 'gi'), `<h3>${(faqByCategory[category] || faqByCategory['Personal Finance'])[0]}</h3>`)
    html = html.replace(new RegExp(`Write down one decision related to ${kwRe}, gather the numbers, and compare the tradeoffs before taking action\\.`, 'gi'), 'Pick one practical decision, gather the numbers, and compare the tradeoffs before acting.')
    html = html.replace(new RegExp(`Before making a decision based on ${kwRe}, verify anything that can change\\.`, 'gi'), 'Before acting, verify anything that can change.')
    html = html.replace(new RegExp(`Use ${kwRe} as a starting point, not a final instruction\\.`, 'gi'), 'Use this guide as a starting point, not a final instruction.')
  }

  html = html.replace(/<p>For CashClimb readers, the useful question is simple: what action can improve your position without creating unnecessary risk\? That framing keeps the advice practical, especially for beginners\.<\/p>/gi, '<p>The practical question is simple: what action improves your position without creating a bigger problem later?</p>')
  html = html.replace(/<h2>What you can do next<\/h2>/gi, '<h2>Next steps</h2>')
  html = html.replace(/<p>Choose one action from this guide and do it this week\. A clear next step is usually more valuable than trying to solve the whole problem in one sitting\.<\/p>/gi, '<p>Choose one practical action that improves your position without creating unnecessary risk.</p>')
  html = html.replace(/<p>Pick one action from this guide and do it this week\. Small, repeatable progress is usually more useful than trying to fix everything at once\.<\/p>/gi, '<p>Pick one realistic improvement, gather the numbers, and compare the tradeoffs before acting.</p>')

  if (!/consumerfinance\.gov|irs\.gov|investor\.gov|ssa\.gov|finra\.org|hud\.gov|fdic\.gov/i.test(html)) {
    html = html.replace(/<h2>FAQ<\/h2>/i, `${sourceSentence(category)}\n<h2>FAQ</h2>`)
  }

  return html.replace(/\n{3,}/g, '\n\n').trim()
}

const { data: posts, error } = await supabase.from('posts').select('id,title,body,primary_keyword,category')
if (error) throw error

let changed = 0
for (const post of posts || []) {
  const category = inferCategory(post)
  const next = cleanBody(post.body, post.primary_keyword || post.title, category)
  if (next !== post.body) {
    const { error: updateError } = await supabase.from('posts').update({ body: next, category, updated_at: new Date().toISOString() }).eq('id', post.id)
    if (updateError) throw updateError
    changed++
    console.log(`updated: ${post.title}`)
  }
}

console.log(`Done. Updated ${changed} posts.`)
