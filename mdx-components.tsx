import type { MDXComponents } from "mdx/types";

const mdxComponentOverrides: MDXComponents = {
  a: (props) => <a {...props} className={`underline underline-offset-4 ${props.className ?? ""}`.trim()} />,
  h2: (props) => <h2 {...props} className={`mt-6 font-semibold text-xl ${props.className ?? ""}`.trim()} />,
  h3: (props) => <h3 {...props} className={`mt-5 font-semibold text-lg ${props.className ?? ""}`.trim()} />,
  p: (props) => <p {...props} className={`leading-7 ${props.className ?? ""}`.trim()} />,
  ul: (props) => <ul {...props} className={`list-disc space-y-2 pl-5 ${props.className ?? ""}`.trim()} />,
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponentOverrides,
    ...components,
  };
}
