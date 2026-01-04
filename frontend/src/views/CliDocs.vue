<script setup>
import CommandBlock from "../components/CommandBlock.vue";
import Navbar from "../components/Navbar.vue"

</script>

<template>
  <Navbar />

  <div class="docs-page">
    <div class="docs-container">
      <h1 class="docs-title">Codebhejo CLI</h1>
      <p class="docs-subtitle">
        Share and receive files directly from your terminal.
      </p>

      <!-- INSTALL -->
      <section class="docs-section">
        <h2>Installation</h2>

        <h3>macOS / Linux</h3>
        <CommandBlock
          command="curl -fsSL https://codebhejo.in/install.sh | bash"
        />

        <CommandBlock command="codebhejo version" label="Verify installation" />
      </section>

      <!-- SEND -->
      <section class="docs-section">
        <h2>Send a File</h2>
        <p>Upload a file and get a shareable link.</p>

        <CommandBlock command="codebhejo send myfile.zip" />

        <div class="note">
          The command outputs a secure share link you can send to anyone.
        </div>
      </section>

      <!-- RECEIVE -->
      <section class="docs-section">
        <h2>Receive a File</h2>

        <CommandBlock
          command="codebhejo receive https://codebhejo.in/d/abc123"
        />

        <p class="muted">
          The file is downloaded to your current directory.
        </p>
      </section>

      <!-- HELP -->
      <section class="docs-section">
        <h2>Help</h2>

        <CommandBlock command="codebhejo help" />
        <CommandBlock command="codebhejo send --help" />
        <CommandBlock command="codebhejo receive --help" />
      </section>
    </div>
  </div>

</template>

<style scoped>
.docs-page {
  min-height: calc(100vh - 64px);
  background: #0f0f0f;
  padding: 48px 0;
}

.docs-container {
  max-width: 720px;
  margin: auto;
  padding: 0 20px;
  color: #e5e7eb;
  font-family: "Fira Code", monospace;
}

.docs-title {
  font-size: 32px;
  margin-bottom: 8px;
  text-align: center;
}

.docs-subtitle {
  text-align: center;
  color: #9ca3af;
  margin-bottom: 42px;
}

.docs-section {
  margin-bottom: 42px;
}

.docs-section h2 {
  font-size: 20px;
  margin-bottom: 14px;
}

.docs-section h3 {
  font-size: 14px;
  color: #9ca3af;
  margin: 18px 0 8px;
}

.muted {
  font-size: 13px;
  color: #9ca3af;
}

.note {
  margin-top: 10px;
  font-size: 13px;
  color: #9ca3af;
}

.flag-list {
  margin-top: 12px;
  font-size: 13px;
  color: #9ca3af;
}

.flag-list li {
  margin-bottom: 6px;
}
</style>
