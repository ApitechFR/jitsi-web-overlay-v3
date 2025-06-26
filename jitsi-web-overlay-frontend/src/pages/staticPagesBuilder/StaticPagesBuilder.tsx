import { useState, useEffect, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import CircularProgress from '@mui/material/CircularProgress';
import styles from './StaticPagesBuilder.module.css';
import slug from 'remark-slug';
import rehypeRaw from 'rehype-raw';
import { Accordion } from '@codegouvfr/react-dsfr/Accordion';

interface StaticPagesBuilderProps {
  contentTable: boolean;
  markDown: string;
}

// a component wich transforms all .md files to react components/pages
export default function StaticPagesBuilder({
  contentTable,
  markDown,
}: StaticPagesBuilderProps) {
  const [markdown, setMarkdown] = useState<string>('');
  const [tableOfContent, setTableOfContent] = useState<NonNullable<ReactNode>>(
    <></>
  );
  const [isLoded, setIsLoded] = useState<boolean>(false);

  useEffect(() => {
    fetch(markDown)
      .then(response => response.text())
      .then(text => {
        setMarkdown(text);
      })
      .then(() => {
        setTableOfContent(<TableOfContent />);
      })
      .then(() => {
        setIsLoded(true);
      })
      .then(() => {
        if (window.location.hash) {
          window.location.href = window.location.hash;
        }
      });
  }, [markDown]);

  return (
    <>
      {isLoded ? (
        <div className={styles.content}>
          {contentTable ? (
            <Accordion
              label="Tables des matières"
              className={styles.contentTable2}
            >
              {tableOfContent}
            </Accordion>
          ) : null}
          <ReactMarkdown
            className={styles.markdown}
            remarkPlugins={[slug]}
            rehypePlugins={[rehypeRaw]}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      ) : (
        <div className={styles.progress}>
          <CircularProgress style={{ height: '300px', width: '300px' }} />
        </div>
      )}
    </>
  );
}

// selects all the headings from the DOM
function useHeadings() {
  const [headings, setHeadings] = useState<Element[]>();
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll('h1, h2, h3, h4, h5, h6') as NodeListOf<Element>
    ).map(element => element);
    setHeadings(elements);
  }, []);
  return headings as Element[];
}

// makes the refresh of the page stateful (preserve the hash location)
function TableOfContent() {
  const headings = useHeadings();
  return (
    <div>
      <ul>
        {headings
          ? headings.map(heading => {
              if (
                heading.nodeName.toLocaleLowerCase() === 'h1' &&
                heading.textContent !== 'Tables des matières'
              ) {
                return (
                  <li className={styles.h1} key={heading.id}>
                    <a href={'#' + heading.id}>{heading.textContent}</a>
                  </li>
                );
              }
              if (
                heading.nodeName.toLocaleLowerCase() === 'h2' &&
                heading.textContent !== 'Tables des matières'
              ) {
                return (
                  <li className={styles.h2} key={heading.id}>
                    <a href={'#' + heading.id}>{heading.textContent}</a>
                  </li>
                );
              }
              if (
                heading.nodeName.toLocaleLowerCase() === 'h3' &&
                heading.textContent !== 'Tables des matières'
              ) {
                return (
                  <li className={styles.h3} key={heading.id}>
                    <a href={'#' + heading.id}>{heading.textContent}</a>
                  </li>
                );
              }
              if (
                heading.nodeName.toLocaleLowerCase() === 'h4' &&
                heading.textContent !== 'Tables des matières'
              ) {
                return (
                  <li className={styles.h4} key={heading.id}>
                    <a href={'#' + heading.id}>{heading.textContent}</a>
                  </li>
                );
              }
              if (
                heading.nodeName.toLocaleLowerCase() === 'h5' &&
                heading.textContent !== 'Tables des matières'
              ) {
                return (
                  <li className={styles.h5} key={heading.id}>
                    <a href={'#' + heading.id}>{heading.textContent}</a>
                  </li>
                );
              }
              if (
                heading.nodeName.toLocaleLowerCase() === 'h6' &&
                heading.textContent !== 'Tables des matières'
              ) {
                return (
                  <li className={styles.h6} key={heading.id}>
                    <a href={'#' + heading.id}>{heading.textContent}</a>
                  </li>
                );
              }
            })
          : null}
      </ul>
    </div>
  );
}
