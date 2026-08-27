import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class FrontendContractTests(unittest.TestCase):
    def test_owned_prompt_cards_never_receive_array_index_as_shared_flag(self):
        source = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertNotIn("matches.map(promptCard)", source)
        self.assertIn("matches.map(prompt => promptCard(prompt))", source)
        self.assertIn('data-edit-prompt="${escapeHtml(prompt.id)}"', source)
        self.assertIn('data-delete-prompt="${escapeHtml(prompt.id)}"', source)

    def test_prompt_tabs_come_first_and_open_by_default(self):
        source = (ROOT / "app.js").read_text(encoding="utf-8")
        page = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertRegex(source, r'libraryTab: "prompts"')
        self.assertRegex(source, r'sharedTab: "prompts"')
        private_tabs = re.search(r'aria-label="私人仓库类型">(?P<body>.*?)</div>', page, re.S).group("body")
        shared_tabs = re.search(r'aria-label="授权仓库类型">(?P<body>.*?)</div>', page, re.S).group("body")
        self.assertLess(private_tabs.index('data-library-tab="prompts"'), private_tabs.index('data-library-tab="skills"'))
        self.assertLess(shared_tabs.index('data-shared-tab="prompts"'), shared_tabs.index('data-shared-tab="skills"'))


if __name__ == "__main__":
    unittest.main()
