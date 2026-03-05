interface Props {
  path: string;
  name: string;
  sections: string[];
}

export default function Page(props: Props) {
  return (
    <html>
      <head>
        <title>{props.name}</title>
      </head>
      <body>
        {props.sections.map((sectionHtml, index) => (
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: sectionHtml }}
          />
        ))}
      </body>
    </html>
  );
}
