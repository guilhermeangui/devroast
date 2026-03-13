import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { DiffLine } from "@/components/ui/diff-line";
import { LeaderboardRow } from "@/components/ui/leaderboard-row";
import { ScoreRing } from "@/components/ui/score-ring";
import { ToggleShowcase } from "./toggle-showcase";

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-sm font-bold text-accent-green">
        {"//"}
      </span>
      <h2 className="font-mono text-lg font-bold text-text-primary">
        {children}
      </h2>
    </div>
  );
}

function SubTitle({ children }: { children: string }) {
  return (
    <h3 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
      {children}
    </h3>
  );
}

const sampleCode = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; ...) {
    total = total + items[i].price;
  }
}`;

export default function ComponentsPage() {
  return (
    <div className="min-h-screen bg-bg-page p-10">
      <header className="mb-12">
        <h1 className="font-mono text-2xl font-bold text-text-primary">
          {"// components"}
        </h1>
        <p className="mt-2 font-mono text-sm text-text-secondary">
          Showcase de todos os componentes UI e suas variantes.
        </p>
      </header>

      <div className="flex flex-col gap-16">
        {/* Button */}
        <section className="flex flex-col gap-6">
          <SectionTitle>Button</SectionTitle>

          <div className="flex flex-col gap-4">
            <SubTitle>Variants</SubTitle>
            <div className="flex items-center gap-4">
              <Button variant="primary">$ primary</Button>
              <Button variant="secondary">$ secondary</Button>
              <Button variant="ghost">$ ghost</Button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <SubTitle>Sizes</SubTitle>
            <div className="flex items-center gap-4">
              <Button variant="primary" size="sm">
                $ small
              </Button>
              <Button variant="primary" size="md">
                $ medium
              </Button>
              <Button variant="primary" size="lg">
                $ large
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <SubTitle>All combinations</SubTitle>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <Button variant="primary" size="sm">
                  $ primary sm
                </Button>
                <Button variant="primary" size="md">
                  $ primary md
                </Button>
                <Button variant="primary" size="lg">
                  $ primary lg
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="secondary" size="sm">
                  $ secondary sm
                </Button>
                <Button variant="secondary" size="md">
                  $ secondary md
                </Button>
                <Button variant="secondary" size="lg">
                  $ secondary lg
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm">
                  $ ghost sm
                </Button>
                <Button variant="ghost" size="md">
                  $ ghost md
                </Button>
                <Button variant="ghost" size="lg">
                  $ ghost lg
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <SubTitle>Disabled</SubTitle>
            <div className="flex items-center gap-4">
              <Button variant="primary" disabled>
                $ primary
              </Button>
              <Button variant="secondary" disabled>
                $ secondary
              </Button>
              <Button variant="ghost" disabled>
                $ ghost
              </Button>
            </div>
          </div>
        </section>

        {/* Toggle */}
        <section className="flex flex-col gap-6">
          <SectionTitle>Toggle</SectionTitle>
          <ToggleShowcase />
        </section>

        {/* Badge */}
        <section className="flex flex-col gap-6">
          <SectionTitle>Badge</SectionTitle>

          <div className="flex flex-col gap-4">
            <SubTitle>Variants</SubTitle>
            <div className="flex items-center gap-6">
              <Badge variant="critical">critical</Badge>
              <Badge variant="warning">warning</Badge>
              <Badge variant="good">good</Badge>
              <Badge variant="info">info</Badge>
            </div>
          </div>
        </section>

        {/* CodeBlock */}
        <section className="flex flex-col gap-6">
          <SectionTitle>CodeBlock</SectionTitle>

          <div className="flex flex-col gap-4">
            <SubTitle>With filename</SubTitle>
            <div className="max-w-xl">
              <CodeBlock
                code={sampleCode}
                lang="javascript"
                filename="calculate.js"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <SubTitle>Without filename</SubTitle>
            <div className="max-w-xl">
              <CodeBlock code={'const x = "hello world";'} lang="javascript" />
            </div>
          </div>
        </section>

        {/* DiffLine */}
        <section className="flex flex-col gap-6">
          <SectionTitle>DiffLine</SectionTitle>

          <div className="flex flex-col gap-4">
            <SubTitle>Types</SubTitle>
            <div className="max-w-xl">
              <DiffLine type="removed">var total = 0;</DiffLine>
              <DiffLine type="added">const total = 0;</DiffLine>
              <DiffLine type="context">
                {"for (let i = 0; i < items.length; i++) {"}
              </DiffLine>
            </div>
          </div>
        </section>

        {/* LeaderboardRow */}
        <section className="flex flex-col gap-6">
          <SectionTitle>LeaderboardRow</SectionTitle>

          <div className="flex flex-col gap-4">
            <SubTitle>Score colors</SubTitle>
            <div className="max-w-2xl">
              <LeaderboardRow
                rank={1}
                score={2.1}
                codePreview="function calculateTotal(items) { var total = 0; ..."
                language="javascript"
              />
              <LeaderboardRow
                rank={2}
                score={5.4}
                codePreview="async function fetchData() { const res = await fetch(url); ..."
                language="typescript"
              />
              <LeaderboardRow
                rank={3}
                score={8.9}
                codePreview="def merge_sort(arr): if len(arr) <= 1: return arr ..."
                language="python"
              />
            </div>
          </div>
        </section>

        {/* ScoreRing */}
        <section className="flex flex-col gap-6">
          <SectionTitle>ScoreRing</SectionTitle>

          <div className="flex flex-col gap-4">
            <SubTitle>Different scores</SubTitle>
            <div className="flex items-center gap-10">
              <ScoreRing score={2.1} />
              <ScoreRing score={5.5} />
              <ScoreRing score={8.7} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <SubTitle>Custom size</SubTitle>
            <div className="flex items-center gap-10">
              <ScoreRing score={3.5} size={120} strokeWidth={3} />
              <ScoreRing score={7.2} size={200} strokeWidth={5} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
