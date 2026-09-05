# Miss Aria — Owner WhatsApp Control Upgrade

Added the natural-language WhatsApp control flows requested:

- "Aria, update your profile picture." -> asks for an image -> validates/normalizes it -> asks for confirmation -> updates only after confirmation.
- "Aria, use this image for Zuno." -> resolves Zuno -> asks for image -> validates -> confirmation -> real group-picture update.
- "Aria, make this the group picture." -> works when the owner is speaking inside the current group.
- "show me my groups" stores the returned group list so "use this image for all 4" can target the last displayed set.
- Group-picture bulk updates run each real WhatsApp operation separately and report successes/failures honestly.
- Image validation checks actual decodability with sharp, enforces a 10 MB limit, accepts JPEG/PNG/WebP, rotates and crops to a WhatsApp-friendly 640x640 JPEG.
- Natural owner controls now work in groups as well as DMs.
- Tool execution now centrally understands OWNER, GROUP_ADMIN and USER permission levels; group-admin permissions are checked against real group membership/admin metadata.
- No success message is sent unless the underlying WhatsApp API operation succeeds.

High-risk profile/group-picture changes still require an explicit "yes" confirmation.
