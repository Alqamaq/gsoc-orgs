import Link from "next/link";
import { GitHubIcon, TwitterIcon } from "@/components/icons";
import { SOCIAL_LINKS } from "@/components/footer-common";

interface SocialLinksProps {
  /**
   * Show text labels next to icons
   * @default false
   */
  showLabels?: boolean;
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Custom className for links
   */
  linkClassName?: string;
  /**
   * Custom text color style (for dark backgrounds)
   */
  textColor?: string;
}

/**
 * Reusable Social Links Component
 * Displays GitHub and Twitter/X links with icons
 */
export const SocialLinks = ({
  showLabels = false,
  className = "flex items-center gap-4",
  linkClassName = "hover:text-background transition-colors",
  textColor,
}: SocialLinksProps) => {
  const linkStyle = textColor ? { color: textColor } : undefined;

  return (
    <div className={className}>
      <Link
        href={SOCIAL_LINKS.github.href}
        target="_blank"
        rel="noopener"
        className={linkClassName}
        aria-label={SOCIAL_LINKS.github.label}
        style={linkStyle ? { ...linkStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' } : undefined}
      >
        <GitHubIcon />
        {showLabels && <span>GitHub</span>}
      </Link>
      <Link
        href={SOCIAL_LINKS.twitter.href}
        target="_blank"
        rel="noopener"
        className={linkClassName}
        aria-label={SOCIAL_LINKS.twitter.label}
        style={linkStyle ? { ...linkStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' } : undefined}
      >
        <TwitterIcon />
        {showLabels && <span>Twitter (X)</span>}
      </Link>
    </div>
  );
};

