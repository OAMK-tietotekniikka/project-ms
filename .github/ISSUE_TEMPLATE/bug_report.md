name: Bug Report
description: Found a bug? Report it here
labels: bug
body:
  - type: textarea
    id: problem
    attributes:
      label: What happened?
      description: |
        Describe the bug clearly
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: How can we reproduce it (as minimally and precisely as possible)?
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: What did you expect to happen?
    validations:
      required: true

  - type: textarea
    id: os_browser
    attributes:
      label: Browser & OS info
      description: |
        - Browser: [Find yours here](https://www.whatsmybrowser.org/)
        - OS: [Find yours here](https://whatsmyos.com/)
    validations:
      required: true

  - type: textarea
    id: additional
    attributes:
      label: Anything else we need to know?
