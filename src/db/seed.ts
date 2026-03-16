import { faker } from "@faker-js/faker";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NewRoast, RoastIssue } from "./schema/roasts";
import { roasts } from "./schema/roasts";

// ── Types ──────────────────────────────────────────────────────────────────

type Language = NonNullable<NewRoast["language"]>;
type Verdict = NonNullable<NewRoast["verdict"]>;
type IssueSeverity = RoastIssue["severity"];

// ── Constants ──────────────────────────────────────────────────────────────

const LANGUAGES: Language[] = [
  "javascript",
  "typescript",
  "python",
  "rust",
  "go",
  "java",
  "c",
  "cpp",
  "csharp",
  "php",
  "ruby",
  "swift",
  "kotlin",
  "sql",
  "shell",
  "other",
];

const ISSUE_SEVERITIES: IssueSeverity[] = ["critical", "warning", "good"];

// ── Score → Verdict mapping ────────────────────────────────────────────────

function scoreToVerdict(score: number): Verdict {
  if (score < 3.0) return "needs_serious_help";
  if (score < 5.0) return "pretty_bad";
  if (score < 7.0) return "could_be_worse";
  if (score < 9.0) return "not_terrible";
  return "surprisingly_good";
}

// ── Roast quote templates ──────────────────────────────────────────────────

const ROAST_QUOTES: Record<Verdict, string[]> = {
  needs_serious_help: [
    "this code looks like it was written during a power outage... in 2005.",
    "i've seen better code in a first-year dropout's homework.",
    "whoever wrote this should be legally prohibited from touching a keyboard.",
    "this is less a program and more a cry for help.",
    "i had to take a break after reading this. and i'm an AI.",
    "this code has more red flags than a bullfighting arena.",
    "the garbage collector called — it wants to retire early.",
    "reading this gave me stack overflow. the website, not the error.",
  ],
  pretty_bad: [
    "not the worst thing i've seen today, but it's close.",
    "this code works by accident, not by design.",
    "there are ideas here — none of them good, but they exist.",
    "this reads like a tutorial was followed with one eye closed.",
    "somewhere between 'it compiles' and 'it should compile'.",
    "i've seen worse, but i've also seen paint dry and that was more engaging.",
    "this code has the confidence of someone who just googled 'what is a variable'.",
  ],
  could_be_worse: [
    "mediocrity achieved. the bar was on the floor, but you cleared it.",
    "it works. sometimes. in ideal conditions. with the wind in the right direction.",
    "C+ student energy. shows up, does the minimum, goes home.",
    "this code is like a diet soda — technically it does the job, but at what cost.",
    "it's giving 'copied from stack overflow and didn't read the answer'.",
    "technically functional. spiritually empty.",
  ],
  not_terrible: [
    "okay, this is actually not bad. i'm mildly impressed and deeply suspicious.",
    "clean enough to run, messy enough to make a senior dev twitch.",
    "solid work. a few rough edges, but you clearly know what you're doing.",
    "this code was written by someone who's read at least one book.",
    "not elegant, but respectable. like a clean fork after camping.",
  ],
  surprisingly_good: [
    "i was ready to roast and you handed me a salad. well done.",
    "clean, readable, idiomatic. are you sure you submitted the right file?",
    "this is what happens when someone actually reads the docs.",
    "i have very little to complain about, and that's deeply uncomfortable for me.",
    "legitimate engineering. the world is not ready.",
  ],
};

// ── Code snippets by language ──────────────────────────────────────────────

const CODE_SNIPPETS: Record<Language, string[]> = {
  javascript: [
    `var total = 0;\nfor (var i = 0; i < items.length; i++) {\n  total = total + items[i].price;\n}\nconsole.log(total);`,
    `function isEven(n) {\n  if (n % 2 == 0) {\n    return true;\n  } else {\n    return false;\n  }\n}`,
    `eval(prompt("enter code"))\ndocument.write(response)\n// trust the user lol`,
    `const data = await fetch(url)\nconst json = await data.json()\nreturn json`,
    `setTimeout(function() {\n  setTimeout(function() {\n    setTimeout(function() {\n      doThing();\n    }, 100);\n  }, 100);\n}, 100);`,
    `var x = 1;\nvar x = 2;\nvar x = 3;\nconsole.log(x); // 3, obviously`,
  ],
  typescript: [
    `if (x == true) { return true; }\nelse if (x == false) { return false; }\nelse { return !false; }`,
    `function add(a: any, b: any): any {\n  return a + b;\n}`,
    `const result: any = someFunction() as any;\nreturn (result as any).value as string;`,
    `type User = {\n  id: number;\n  name: string;\n  data: any;\n  stuff: any;\n  thing: any;\n}`,
    `// @ts-ignore\n// @ts-ignore\n// @ts-ignore\nconst x = doUnsafeThing();`,
  ],
  python: [
    `def calculate(items):\n    total = 0\n    for i in range(0, len(items), 1):\n        total = total + items[i]\n    return total`,
    `import os\nimport sys\nimport json\nimport time\nimport random\n# only using random`,
    `password = "admin123"\ndb_url = "postgresql://root:password@prod-server/db"\napi_key = "sk-real-key-here"`,
    `def is_palindrome(s):\n    reversed_s = ''\n    for i in range(len(s)-1, -1, -1):\n        reversed_s += s[i]\n    return s == reversed_s`,
    `x = []\nfor i in range(1000):\n    x = x + [i]  # O(n²) go brr`,
  ],
  rust: [
    `fn main() {\n    let x = 5;\n    let y = x.clone();\n    let z = y.clone();\n    println!("{}", z.clone());\n}`,
    `fn get_value(map: &HashMap<String, i32>, key: &str) -> i32 {\n    map[key] // panics on missing key\n}`,
    `unsafe {\n    let ptr = &x as *const i32;\n    let val = *ptr;\n    println!("{}", val);\n}`,
    `fn add(a: i32, b: i32) -> i32 {\n    return a + b; // explicit return in rust, bold choice\n}`,
  ],
  go: [
    `func divide(a, b int) int {\n    return a / b // what could go wrong\n}`,
    `err := doSomething()\nif err != nil {\n    _ = err // we cool\n}`,
    `var globalState map[string]interface{}\nfunc init() {\n    globalState = make(map[string]interface{})\n}`,
    `for i := 0; i < 10; i++ {\n    go func() {\n        fmt.Println(i) // classic goroutine closure bug\n    }()\n}`,
  ],
  java: [
    `public static void main(String[] args) {\n    String s = null;\n    System.out.println(s.length());\n}`,
    `try {\n    doRiskyThing();\n} catch (Exception e) {\n    // it's fine\n}`,
    `public class God {\n    // 4000 lines\n    public void doEverything() { ... }\n    public void alsoThis() { ... }\n    public void andThis() { ... }\n}`,
    `for (int i = 0; i < list.size(); i++) {\n    for (int j = 0; j < list.size(); j++) {\n        if (list.get(i).equals(list.get(j))) {\n            // O(n²) search\n        }\n    }\n}`,
  ],
  c: [
    `char buf[8];\nscanf("%s", buf); // buffer overflow speedrun`,
    `int* p = malloc(sizeof(int));\n*p = 42;\n// free(p); some other day`,
    `#define TRUE FALSE\n#define FALSE TRUE\n// makes debugging fun`,
    `strcpy(dest, src); // destination size? we don't do that here`,
  ],
  cpp: [
    `void* ptr = malloc(1024);\n// ... 200 lines later ...\n// free somewhere maybe`,
    `using namespace std;\nusing namespace boost;\nusing namespace everything;`,
    `new int[1000000]; // yolo allocation\n// destructor? never heard of her`,
    `template<typename T, typename U, typename V, typename W>\nauto process(T a, U b, V c, W d) { return a + b + c + d; }`,
  ],
  csharp: [
    `catch (Exception ex)\n{\n    Console.WriteLine("error lol");\n    // swallow and pray\n}`,
    `public string Name { get; set; }\npublic string Name2 { get; set; }\npublic string NameNew { get; set; }\npublic string NameFinal { get; set; }`,
    `Thread.Sleep(5000); // just wait, it'll work\ndoThing();`,
    `var result = items\n    .Where(x => x != null)\n    .Select(x => x!)\n    .Where(x => x.Value != null)\n    .ToList();`,
  ],
  php: [
    `$query = "SELECT * FROM users WHERE id = " . $_GET['id'];\n// SQLi? never heard of it`,
    `echo $_POST['comment']; // raw, unescaped, dangerous`,
    `if ($_POST['password'] == 'admin') {\n    // welcome, god\n}`,
    `$conn = mysql_connect("localhost","root","");\n// mysql_ functions, a classic`,
  ],
  ruby: [
    `def method_missing(name, *args)\n    puts "called #{name} with #{args}"\nend\n// catch-all magic`,
    `eval(params[:code]) # what's the worst that could happen`,
    `User.all.each do |user|\n  user.update(last_seen: Time.now) # N+1 who?\nend`,
    `hash = {a: 1}\nhash[:b][:c] = 2 # NoMethodError: undefined method '[]=' for nil`,
  ],
  swift: [
    `let value = dict["key"]!\nlet result = value!.name!\nprint(result!)`,
    `class ViewController: UIViewController {\n    var data: [String] = []\n    // load data in viewWillAppear. every time.\n}`,
    `DispatchQueue.main.async {\n    DispatchQueue.main.async {\n        DispatchQueue.main.async {\n            updateUI()\n        }\n    }\n}`,
  ],
  kotlin: [
    `val x: String? = null\nval len = x!!.length // brave`,
    `fun process(list: List<Any>): List<Any> {\n    return list.map { it as String }.map { it as Any }\n}`,
    `Thread.sleep(3000)\nfetchData() // blocking the main thread, legendary`,
  ],
  sql: [
    `SELECT * FROM users, orders, products, reviews\nWHERE users.id > 0`,
    `DELETE FROM users;\n-- forgot the WHERE clause. oops.`,
    `SELECT *\nFROM orders\nWHERE status = 'pending'\nOR status = 'pending'\nOR status = 'pending'`,
    `UPDATE users SET admin = 1 WHERE id = 1 OR 1=1`,
  ],
  shell: [
    `rm -rf / # cleanup script\n# don't run as root lol`,
    `curl https://example.com/install.sh | sudo bash`,
    `chmod 777 /etc/passwd\n# permissions? we don't do that here`,
    `cd /tmp && rm -rf * && echo "cleaned!"`,
  ],
  other: [
    `TODO: write this later\nTODO: fix this\nTODO: actually understand what this does`,
    `// copy-pasted from stackoverflow\n// not sure why it works\n// afraid to touch it`,
    `magic_number = 42\nother_magic = 1337\nyet_another = 9999\n# no context whatsoever`,
  ],
};

// ── Issue templates ────────────────────────────────────────────────────────

const ISSUE_TEMPLATES: Record<
  IssueSeverity,
  Array<{ title: string; description: string }>
> = {
  critical: [
    {
      title: "SQL injection vulnerability",
      description:
        "user input is interpolated directly into the query string. parameterize all inputs immediately.",
    },
    {
      title: "hardcoded credentials",
      description:
        "passwords and API keys in source code get committed to git and leaked. use environment variables.",
    },
    {
      title: "unbounded buffer access",
      description:
        "writing past allocated memory bounds causes undefined behavior and exploitable crashes.",
    },
    {
      title: "swallowed exception",
      description:
        "empty catch blocks hide failures silently. at minimum, log the error. better yet, handle it.",
    },
    {
      title: "eval() on user input",
      description:
        "executing arbitrary user-supplied code is a remote code execution vulnerability. never do this.",
    },
    {
      title: "null dereference without guard",
      description:
        "accessing properties on a potentially-null value will throw at runtime. guard before accessing.",
    },
    {
      title: "N+1 query inside loop",
      description:
        "running a database query inside a loop fires one query per iteration. use a join or batch load.",
    },
    {
      title: "memory leak — allocation without free",
      description:
        "allocated memory is never released. under load this will exhaust the heap and crash the process.",
    },
  ],
  warning: [
    {
      title: "using var instead of const/let",
      description:
        "var is function-scoped and leads to hoisting bugs. use const by default, let when reassignment is needed.",
    },
    {
      title: "imperative loop pattern",
      description:
        "for loops are verbose and error-prone. use .map() or .reduce() for cleaner transformations.",
    },
    {
      title: "any type annotation",
      description:
        "using 'any' disables type checking for the expression. narrow the type or use unknown with a guard.",
    },
    {
      title: "O(n²) algorithm",
      description:
        "nested iteration over the same collection scales poorly. consider a hash map for O(n) lookup.",
    },
    {
      title: "magic numbers without constants",
      description:
        "numeric literals scattered in code are hard to understand and update. extract named constants.",
    },
    {
      title: "blocking the event loop",
      description:
        "synchronous sleep or heavy computation on the main thread freezes all other work. offload or await.",
    },
    {
      title: "unused imports",
      description:
        "importing modules that are never used adds to bundle size and makes the dependency list misleading.",
    },
    {
      title: "deeply nested callbacks",
      description:
        "callback pyramids are hard to read and reason about. flatten with async/await or promises.",
    },
    {
      title: "global mutable state",
      description:
        "shared global variables create implicit coupling and make testing unpredictable. pass state explicitly.",
    },
  ],
  good: [
    {
      title: "clear naming conventions",
      description:
        "variable and function names are descriptive and communicate intent without needing comments.",
    },
    {
      title: "single responsibility",
      description:
        "the function does one thing well. no side effects, no hidden complexity, easy to test in isolation.",
    },
    {
      title: "early return pattern",
      description:
        "returning early on invalid input reduces nesting and makes the happy path obvious.",
    },
    {
      title: "consistent formatting",
      description:
        "indentation, spacing, and brace style are consistent throughout. easy to scan and diff.",
    },
    {
      title: "input validation at boundary",
      description:
        "external data is validated before being used internally. the function assumes safe inputs downstream.",
    },
    {
      title: "immutable by default",
      description:
        "values that don't change are declared with const. mutation is explicit and minimal.",
    },
  ],
};

// ── Suggested fix templates ────────────────────────────────────────────────

const SUGGESTED_FIXES: Record<Language, string[]> = {
  javascript: [
    `- var total = 0;\n- for (var i = 0; i < items.length; i++) {\n-   total = total + items[i].price;\n- }\n+ const total = items.reduce((sum, item) => sum + item.price, 0);`,
    `- function isEven(n) {\n-   if (n % 2 == 0) { return true; }\n-   else { return false; }\n- }\n+ const isEven = (n) => n % 2 === 0;`,
    `- setTimeout(function() {\n-   setTimeout(function() {\n-     doThing();\n-   }, 100);\n- }, 100);\n+ await new Promise(r => setTimeout(r, 200));\n+ await doThing();`,
  ],
  typescript: [
    `- function add(a: any, b: any): any {\n-   return a + b;\n- }\n+ function add(a: number, b: number): number {\n+   return a + b;\n+ }`,
    `- const result: any = someFunction() as any;\n+ const result = someFunction();\n+ if (!isExpectedType(result)) throw new Error("unexpected shape");`,
  ],
  python: [
    `- total = 0\n- for i in range(0, len(items), 1):\n-     total = total + items[i]\n+ total = sum(items)`,
    `- x = []\n- for i in range(1000):\n-     x = x + [i]\n+ x = list(range(1000))`,
  ],
  rust: [
    `- fn get_value(map: &HashMap<String, i32>, key: &str) -> i32 {\n-     map[key]\n- }\n+ fn get_value(map: &HashMap<String, i32>, key: &str) -> Option<i32> {\n+     map.get(key).copied()\n+ }`,
  ],
  go: [
    `- err := doSomething()\n- if err != nil {\n-     _ = err\n- }\n+ if err := doSomething(); err != nil {\n+     return fmt.Errorf("doSomething: %w", err)\n+ }`,
  ],
  java: [
    `- try {\n-     doRiskyThing();\n- } catch (Exception e) {\n-     // it's fine\n- }\n+ try {\n+     doRiskyThing();\n+ } catch (SpecificException e) {\n+     log.error("failed to do risky thing", e);\n+     throw new ServiceException("operation failed", e);\n+ }`,
  ],
  c: [
    `- char buf[8];\n- scanf("%s", buf);\n+ char buf[256];\n+ scanf("%255s", buf); // bound the read`,
  ],
  cpp: [
    `- using namespace std;\n- using namespace boost;\n+ // prefer explicit qualification: std::vector, std::string`,
  ],
  csharp: [
    `- catch (Exception ex)\n- {\n-     Console.WriteLine("error lol");\n- }\n+ catch (Exception ex)\n+ {\n+     logger.LogError(ex, "operation failed: {Message}", ex.Message);\n+     throw;\n+ }`,
  ],
  php: [
    `- $query = "SELECT * FROM users WHERE id = " . $_GET['id'];\n+ $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");\n+ $stmt->execute([$_GET['id']]);`,
  ],
  ruby: [
    `- User.all.each do |user|\n-   user.update(last_seen: Time.now)\n- end\n+ User.update_all(last_seen: Time.now)`,
  ],
  swift: [
    `- let value = dict["key"]!\n+ guard let value = dict["key"] else {\n+     return\n+ }`,
  ],
  kotlin: [
    `- val x: String? = null\n- val len = x!!.length\n+ val len = x?.length ?: 0`,
  ],
  sql: [
    `- SELECT * FROM users, orders\n- WHERE users.id > 0\n+ SELECT u.id, u.name, o.total\n+ FROM users u\n+ INNER JOIN orders o ON o.user_id = u.id\n+ WHERE u.active = true`,
  ],
  shell: [
    `- rm -rf /\n+ # specify the actual directory you want to clean\n+ rm -rf /tmp/my-app-cache/`,
  ],
  other: [
    `- # TODO: write this later\n+ # implement the actual logic\n+ # use named constants instead of magic numbers`,
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function generateIssues(): RoastIssue[] {
  const count = faker.number.int({ min: 2, max: 4 });
  const severities = pickRandomN(ISSUE_SEVERITIES, count);

  return severities.map((severity) => {
    const template = pickRandom(ISSUE_TEMPLATES[severity]);
    return {
      severity,
      title: template.title,
      description: template.description,
    };
  });
}

function generateRoast(): NewRoast {
  const language = pickRandom(LANGUAGES);
  const score = Number(
    faker.number.float({ min: 0.5, max: 10, fractionDigits: 1 }).toFixed(1),
  );
  const verdict = scoreToVerdict(score);
  const code = pickRandom(CODE_SNIPPETS[language]);
  const lineCount = code.split("\n").length;
  const roastQuote = pickRandom(ROAST_QUOTES[verdict]);
  const fixes = SUGGESTED_FIXES[language];
  const suggestedFix = fixes.length > 0 ? pickRandom(fixes) : null;
  const roastMode = faker.datatype.boolean({ probability: 0.3 });

  // Spread createdAt over the past 90 days for realistic leaderboard data
  const createdAt = faker.date.recent({ days: 90 });

  return {
    code,
    language,
    lineCount,
    roastMode,
    score: score.toFixed(2),
    roastQuote,
    verdict,
    issues: generateIssues(),
    suggestedFix,
    createdAt,
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — run with: pnpm db:seed");
  }

  const db = drizzle(process.env.DATABASE_URL);

  const TOTAL = 100;
  const BATCH_SIZE = 25;

  console.log(`seeding ${TOTAL} roasts in batches of ${BATCH_SIZE}...`);

  const records: NewRoast[] = Array.from({ length: TOTAL }, generateRoast);

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await db.insert(roasts).values(batch);
    console.log(`  inserted ${Math.min(i + BATCH_SIZE, TOTAL)} / ${TOTAL}`);
  }

  console.log("done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
