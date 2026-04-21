"use client";

import { useState, type ReactNode } from "react";

type FaqItem = {
  question: string;
  answer: ReactNode;
  startsOpen?: boolean;
};

type FaqAccordionProps = {
  columns: readonly (readonly FaqItem[])[];
};

export function FaqAccordion({ columns }: FaqAccordionProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      columns.flatMap((column, columnIndex) =>
        column.map((item, itemIndex) => [
          `${columnIndex}-${itemIndex}`,
          Boolean(item.startsOpen),
        ]),
      ),
    ),
  );

  const toggleItem = (itemKey: string) => {
    setOpenItems((current) => ({
      ...current,
      [itemKey]: !current[itemKey],
    }));
  };

  return (
    <div className="faq-placeholder-list">
      {columns.map((column, columnIndex) => (
        <div key={`faq-column-${columnIndex}`} className="faq-placeholder-column">
          {column.map((item, itemIndex) => {
            const itemKey = `${columnIndex}-${itemIndex}`;
            const isOpen = Boolean(openItems[itemKey]);

            return (
              <article
                key={item.question}
                className="faq-placeholder-item"
                data-open={isOpen ? "true" : "false"}
                >
                  <button
                  type="button"
                  className="faq-placeholder-head"
                  aria-expanded={isOpen}
                  onClick={() => toggleItem(itemKey)}
                >
                  <span>{item.question}</span>
                  <span className="faq-placeholder-plus" aria-hidden="true" />
                </button>

                <div
                  className="faq-placeholder-answer-wrap"
                  aria-hidden={!isOpen}
                >
                  <div className="faq-placeholder-answer-inner">
                    <div className="faq-placeholder-answer">{item.answer}</div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ))}
    </div>
  );
}
