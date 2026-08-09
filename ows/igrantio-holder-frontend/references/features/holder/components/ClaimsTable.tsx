/**
 * Claims renderer with the reference-wallet behaviours: base64 portraits
 * become a circular avatar, personal data is blurred until the eye toggle is
 * pressed, nested objects render as indented sections (flattened to dotted
 * keys from depth 3), arrays of objects get numbered section headers.
 */

import { Fragment } from "react";
import { COLORS, isPortraitKey } from "../credentialDisplay";
import { tdStyle, tableStyle } from "./ui";

const isBase64Image = (v: unknown): v is string =>
  typeof v === "string" && (v.startsWith("data:image") || (v.length > 200 && /^[A-Za-z0-9+/=_-]+$/.test(v)));

const imageSrc = (v: string): string => (v.startsWith("data:image") ? v : `data:image/jpeg;base64,${v}`);

const labelize = (key: string): string =>
  key.replace(/[_.]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

interface RowsProps {
  data: Record<string, unknown>;
  blur: boolean;
  depth: number;
  prefix?: string;
}

function valueCell(value: unknown, blur: boolean, key: string) {
  const style = { filter: blur ? "blur(4px)" : undefined };
  if (isBase64Image(value) && isPortraitKey(key)) {
    return <img src={imageSrc(value)} alt={key} style={{ ...style, maxHeight: 120, borderRadius: 8 }} />;
  }
  if (Array.isArray(value)) return <span style={style}>{value.map(String).join(", ")}</span>;
  return <span style={style}>{String(value)}</span>;
}

function Rows({ data, blur, depth, prefix }: RowsProps) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        const label = prefix ? `${prefix}.${key}` : key;
        // Arrays of objects: numbered section headers with indented children.
        if (Array.isArray(value) && value.length && typeof value[0] === "object" && value[0] !== null) {
          return (
            <Fragment key={label}>
              {value.map((item, i) => (
                <Fragment key={`${label}-${i}`}>
                  <tr>
                    <td colSpan={2} style={{ ...tdStyle, background: "#fafafa", fontWeight: 600 }}>
                      {labelize(key)} {i + 1}
                    </td>
                  </tr>
                  <Rows data={item as Record<string, unknown>} blur={blur} depth={depth + 1} />
                </Fragment>
              ))}
            </Fragment>
          );
        }
        // Nested objects: sections until depth 3, dotted keys after.
        if (value && typeof value === "object" && !Array.isArray(value)) {
          if (depth >= 2) {
            return (
              <Rows key={label} data={value as Record<string, unknown>} blur={blur} depth={depth + 1} prefix={label} />
            );
          }
          return (
            <Fragment key={label}>
              <tr>
                <td colSpan={2} style={{ ...tdStyle, background: "#fafafa", fontWeight: 600 }}>
                  {labelize(key)}
                </td>
              </tr>
              <Rows data={value as Record<string, unknown>} blur={blur} depth={depth + 1} />
            </Fragment>
          );
        }
        return (
          <tr key={label}>
            <td style={{ ...tdStyle, color: COLORS.secondary, paddingLeft: 10 + depth * 16, width: "45%" }}>
              {labelize(label)}
            </td>
            <td style={tdStyle}>{valueCell(value, blur, key)}</td>
          </tr>
        );
      })}
    </>
  );
}

export function ClaimsTable({ claims, blur }: { claims: Record<string, unknown>; blur: boolean }) {
  const entries = Object.entries(claims);
  if (!entries.length) return null;

  // First portrait-like base64 value becomes the avatar above the table.
  const portrait = entries.find(([k, v]) => isPortraitKey(k) && isBase64Image(v));

  return (
    <div>
      {portrait && (
        <img
          src={imageSrc(portrait[1] as string)}
          alt="portrait"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            objectFit: "cover",
            filter: blur ? "blur(4px)" : undefined,
            marginBottom: 12,
          }}
        />
      )}
      <table style={tableStyle}>
        <tbody>
          <Rows
            data={portrait ? Object.fromEntries(entries.filter(([k]) => k !== portrait[0])) : claims}
            blur={blur}
            depth={0}
          />
        </tbody>
      </table>
    </div>
  );
}
