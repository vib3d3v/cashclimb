import Link from 'next/link'

const tools = [
  {
    name: 'Savings Calculator',
    href: '/tools/savings-calculator',
  },
  {
    name: 'Compound Calculator',
    href: '/tools/compound-calculator',
  },
]

export default function ToolsNav({ currentPath }: { currentPath: string }) {
  return (
    <div className="mb-10">
      <div className="flex flex-wrap gap-3">
        {tools.map((tool) => {
          const active = currentPath === tool.href

          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? 'bg-gold text-bg'
                  : 'border border-border text-[#9A9490] hover:border-gold hover:text-gold'
              }`}
            >
              {tool.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}