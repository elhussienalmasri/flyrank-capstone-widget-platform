# Build Log — AI Usage

## Where AI helped

- Helped plan and build the full Widget Platform across the Express backend,
  PostgreSQL database, React dashboard, and embeddable widget script.
- Helped implement authentication, tenant isolation, widget management, public
  submissions, visitor signup/login, dashboards, and platform administration.
- Helped diagnose errors, write and improve automated tests, and verify API
  behavior.
- Helped create project  Docker setup guidance.
- Helped review implementation details and improve reliability features such
  as validation, rate limiting, spam prevention, geo enrichment, and safe
  notification handling.

## Where AI was wrong or incomplete

- In the widget field editor, some controls overflowed on Form. For
  example, the **Required** and **Delete** controls did not fit. This was later
  corrected by using `*` for required, a delete icon instead of the full word,
  and improved flex and CSS classes.
- A popover widget was created even when no fields were filled in.
- Signup and login widgets appeared in the Widgets list and Submissions filter,
  even though they do not create submission rows. This was later corrected by
  moving their registered users to the Visitors page and using a visitor filter.
- Total submissions were counted in the dashboard statistics, but total visitors were not counted or displayed.
- Popover trigger values, such as delay time and scroll percentage, were first
  hardcoded instead of allowing owners to enter their own values.
-  When an owner has multiple signup widgets, all of them initially used the same
 visitor-account database. Therefore, a visitor who created an account through one website could log 
 in through another website’s login widget. A visitor should only be able to log in through the website 
 where they created their account.
- When an owner had more than one signup widget, the login widget configuration did not let the owner choose which signup widget it should use. A visitor could choose a login widget and fail to sign in even though their account existed, because that login widget was not linked to the correct signup widget. This was fixed by adding a signup-widget selection field to the login-widget UI, saving the link in the backend configuration, and authenticating visitors against the selected signup widget. Without this link, the UI was confusing: an owner could create any login widget, but it might not work or sign in the visitor when multiple signup widgets exist.
- Account deletion was initially available to a normal user even though the
  requested feature was for a platform admin to manage accounts.
- The submission-notification recipient email was initially hardcoded instead
  of using the owning tenant's configured email.
- CTA form fields were initially fixed instead of allowing each owner to choose
  the fields needed for their own form.
- AI initially used `companyName` for bot detection but rendered that value in
  emails and widget submissions. This field needed to be removed from normal
  displayed submission data.
- Submission notification emails were initially sent as raw JSON instead of a
  readable formatted message.
- After a CTA submission, the inline CTA disappeared and only a popup was shown. Because the developer placed the CTA in the customer website layout, it should remain visible while the success popup appears, so visitors can submit another request without refreshing the page. This also keeps the website UI layout consistent.
- The thank-you popup initially used a plain text link instead of a real button
  and did not let the owner customize the button text or color.
- Widget email verification was initially implemented as an emailed URL with a token that sent the visitor to the Widget Platform. After following the link, the visitor could not sign in because authentication was checked against the wrong signup context instead of the specific signup widget that created the account, Visitors should sign up, verify their account, and sign in on the customer website through the correct signup widget. I asked AI to use a verification-code flow for widget visitors instead, so verification and login stay linked to the correct signup widget, platform account verification remains separate.
The email-link sign-in flow was implemented for Widget Platform owner authentication,
- When an already authenticated owner opened the root URL, the app initially
  kept them there instead of redirecting them to `/dashboard`.

- On the `/widgets` page, AI gave every widget a **View submissions** link. For a signup widget, it incorrectly opened `/submissions?widgetId=...`; it should navigate to `/visitors?widgetId=...` to show the visitors for that signup widget.

- Website statistics were displayed in two places. This was simplified so the statistics appear in one place only.

- Visitor accounts created through signup widgets were not included in the dashboard statistics. This was corrected by adding a separate **Total visitors** statistic.

- The dashboard action buttons were not arranged by importance. **Change password** was too prominent beside **View widgets**. This was improved by making **Create widget** the primary action, moving less important actions aside, and adding a **View visitors** button alongside **View submissions**.

- Other simple issues included AI naming a button **View widgets**, even though it creates widgets. It was renamed to **Create widget**. AI also used hardcoded usernames and passwords for widget accounts and PostgreSQL, so the app would not work unless the user’s environment matched that configuration. These values should be stored in environment variables instead.

- The **Require verification** action for signup widgets and the **Forgot password** action for users were shown even when `EMAIL_FEATURES_ENABLED` was disabled. This was solved by hiding both actions in the UI and configuring the backend to disable the related email-dependent features when email delivery is unavailable.

## What I changed or verified myself

- Fixed the issues listed above and applied solutions, including replacing signup-widget email-verification links with verification codes. This keeps visitors on the customer website and verifies them against the correct signup widget.

- Added a general overview that identifies the features, their number, and the functionality of every feature. It also explains the design of each feature, its fields, what appears to the customer, and what happens after the user submits it, including a thank-you popover with a website or “Learn more” link. I also identified the number of pages and the responsibilities of every page.

- Improved the UI and organization by moving accounts created through signup widgets to the `/visitors` page instead of treating them as submissions.

- Added and improved features, including optional email verification for signup widgets, dynamic CTA and popover fields. Added dynamic CTA and popover fields, with limits to keep forms manageable.Added a widget filter. Enabled owners to set dynamic delay and scroll values for popover triggers. Suggested adding a simple landing page for the platform. configurable thank-you popups with an optional button link.
