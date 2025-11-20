import { useEffect, useRef } from 'react';
import { Box, Text } from '@mantine/core';

interface DisqusCommentsProps {
  shortname: string;
  identifier: string;
  url?: string;
  title?: string;
  language?: string;
}

// Global script loading state
let disqusScriptLoaded = false;
let disqusInstance: any = null;

export function DisqusComments({
  shortname,
  identifier,
  url,
  title,
  language = 'id',
}: DisqusCommentsProps) {
  const disqusRef = useRef<HTMLDivElement>(null);
  const currentIdentifier = useRef<string>('');

  useEffect(() => {
    // Only initialize if identifier has changed
    if (currentIdentifier.current === identifier) {
      return;
    }

    currentIdentifier.current = identifier;

    // Configure Disqus
    window.disqus_config = function () {
      this.page.identifier = identifier;
      this.page.url = url || `${window.location.origin}/newsroom/${identifier}`;
      this.page.title = title || document.title;
      this.language = language;
    };

    // Load Disqus script if not already loaded
    if (!disqusScriptLoaded) {
      const disqusScript = document.createElement('script');
      disqusScript.src = `https://${shortname}.disqus.com/embed.js`;
      disqusScript.setAttribute('data-timestamp', Date.now().toString());
      disqusScript.async = true;
      disqusScript.defer = true;
      disqusScript.id = 'dsq-embed-scr';
      
      // Remove existing script if any
      const existingScript = document.getElementById('dsq-embed-scr');
      if (existingScript) {
        existingScript.remove();
      }

      document.body.appendChild(disqusScript);
      disqusScriptLoaded = true;

      // Wait for Disqus to load
      disqusScript.onload = () => {
        if (window.DISQUS) {
          disqusInstance = window.DISQUS;
        }
      };
    } else {
      // Reset Disqus if already loaded
      if (window.DISQUS) {
        window.DISQUS.reset({
          reload: true,
          config: function () {
            this.page.identifier = identifier;
            this.page.url = url || `${window.location.origin}/newsroom/${identifier}`;
            this.page.title = title || document.title;
            this.language = language;
          },
        });
      }
    }

    return () => {
      // Cleanup on unmount
    };
  }, [shortname, identifier, url, title, language]);

  return (
    <Box mt="xl" pt="xl" style={{ borderTop: '1px solid #e5e5e5' }}>
      <Text size="lg" fw={600} mb="md">
        Komentar
      </Text>
      <div id="disqus_thread" ref={disqusRef} />
      <noscript>
        <Text size="sm" c="dimmed">
          Silakan aktifkan JavaScript untuk melihat komentar Disqus.
        </Text>
      </noscript>
    </Box>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    DISQUS: any;
    disqus_config: () => void;
  }
}

