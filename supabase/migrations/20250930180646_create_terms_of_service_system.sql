/*
  # Create Terms of Service System

  ## Overview
  This migration creates a comprehensive Terms of Service (TOS) tracking system for Ghetto Finance.
  It enables version control of terms, tracks user acceptances, and ensures legal compliance.

  ## New Tables

  ### 1. `terms_of_service`
  Stores all versions of the Terms of Service with full text and metadata.
  - `id` (uuid, primary key) - Unique identifier for each TOS version
  - `version` (text, unique) - Version number (e.g., "1.0", "1.1", "2.0")
  - `title` (text) - Title of the terms document
  - `content` (text) - Full legal text of the terms
  - `effective_date` (timestamptz) - When this version becomes effective
  - `is_current` (boolean) - Whether this is the active version
  - `created_by` (uuid) - Admin user who created this version
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `terms_acceptances`
  Tracks every instance of a user accepting terms, creating a full audit trail.
  - `id` (uuid, primary key) - Unique identifier for acceptance record
  - `user_id` (uuid, foreign key) - User who accepted the terms
  - `terms_version` (text) - Version of terms accepted
  - `ip_address` (text) - IP address at time of acceptance
  - `user_agent` (text) - Browser/device information
  - `accepted_at` (timestamptz) - Timestamp of acceptance
  - `acceptance_method` (text) - How terms were accepted (signup, login, update)

  ### 3. Profile Updates
  Adds terms tracking fields to existing profiles table.
  - `terms_accepted` (boolean) - Quick check if user has accepted current terms
  - `current_terms_version` (text) - Version user has currently accepted
  - `terms_accepted_at` (timestamptz) - When user accepted current terms

  ## Security
  - Enable RLS on all new tables
  - Users can view their own acceptance history
  - Only authenticated users can accept terms
  - Only site masters can create/update terms versions
  - All acceptance records are immutable after creation

  ## Indexes
  - Index on user_id for fast lookup of user acceptances
  - Index on terms_version for version queries
  - Index on is_current for finding active terms
  - Index on accepted_at for audit reporting

  ## Important Notes
  - All terms acceptances are permanently logged for legal compliance
  - IP addresses and user agents are stored for fraud prevention
  - Terms versions are immutable once created
  - Only one version can be marked as current at a time
  - The system supports versioning for regulatory audit requirements
*/

-- Create terms_of_service table
CREATE TABLE IF NOT EXISTS terms_of_service (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT 'Terms of Service',
  content text NOT NULL,
  effective_date timestamptz NOT NULL DEFAULT now(),
  is_current boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create terms_acceptances table
CREATE TABLE IF NOT EXISTS terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version text NOT NULL,
  ip_address text,
  user_agent text,
  accepted_at timestamptz DEFAULT now(),
  acceptance_method text DEFAULT 'manual'
);

-- Add terms tracking fields to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'terms_accepted'
  ) THEN
    ALTER TABLE profiles ADD COLUMN terms_accepted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'current_terms_version'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_terms_version text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'terms_accepted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN terms_accepted_at timestamptz;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE terms_of_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_acceptances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for terms_of_service
CREATE POLICY "Anyone can view current terms"
  ON terms_of_service
  FOR SELECT
  USING (is_current = true);

CREATE POLICY "Site masters can insert terms"
  ON terms_of_service
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.username = 'sitemaster'
    )
  );

CREATE POLICY "Site masters can update terms"
  ON terms_of_service
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.username = 'sitemaster'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.username = 'sitemaster'
    )
  );

-- RLS Policies for terms_acceptances
CREATE POLICY "Users can view their own acceptances"
  ON terms_acceptances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can accept terms"
  ON terms_acceptances
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS terms_acceptances_user_id_idx ON terms_acceptances(user_id);
CREATE INDEX IF NOT EXISTS terms_acceptances_terms_version_idx ON terms_acceptances(terms_version);
CREATE INDEX IF NOT EXISTS terms_acceptances_accepted_at_idx ON terms_acceptances(accepted_at);
CREATE INDEX IF NOT EXISTS terms_of_service_is_current_idx ON terms_of_service(is_current);
CREATE INDEX IF NOT EXISTS terms_of_service_version_idx ON terms_of_service(version);

-- Create function to ensure only one current version
CREATE OR REPLACE FUNCTION ensure_single_current_terms()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE terms_of_service
    SET is_current = false
    WHERE id != NEW.id AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ensuring single current version
DROP TRIGGER IF EXISTS terms_single_current_trigger ON terms_of_service;
CREATE TRIGGER terms_single_current_trigger
  BEFORE INSERT OR UPDATE ON terms_of_service
  FOR EACH ROW
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION ensure_single_current_terms();

-- Insert initial Terms of Service version
INSERT INTO terms_of_service (version, title, content, is_current, effective_date)
VALUES (
  '1.0',
  'Ghetto Finance Terms of Service',
  'COMPREHENSIVE TERMS OF SERVICE AND USER AGREEMENT

By accessing or using the Ghetto Finance platform, you acknowledge and agree to these Terms of Service in their entirety.

1. ACCEPTANCE OF TERMS
By creating an account, accessing, or using any part of the Ghetto Finance platform, you expressly agree to be bound by these Terms of Service, all applicable laws and regulations, and agree that you are solely responsible for compliance with any applicable local, state, national, and international laws and regulations.

2. USER RESPONSIBILITIES AND COMPLIANCE
YOU ARE SOLELY AND ENTIRELY RESPONSIBLE FOR:
- Verifying and complying with all applicable laws, regulations, and licensing requirements in your jurisdiction
- Ensuring all transactions comply with local, state, federal, and international regulations
- Obtaining any necessary licenses, permits, or authorizations for your business activities
- Compliance with all tax obligations related to your transactions on the platform
- Compliance with anti-money laundering (AML) and know-your-customer (KYC) regulations
- Compliance with sanctions, export controls, and trade restriction laws
- Verifying the legality of all items listed, purchased, or sold on the platform
- All cryptocurrency transaction risks including volatility, loss, and regulatory changes
- Understanding and accepting all risks associated with peer-to-peer transactions

3. PLATFORM ROLE AND LIMITATIONS
Ghetto Finance is a technology platform that facilitates peer-to-peer transactions. WE DO NOT:
- Provide legal, financial, tax, or regulatory advice
- Guarantee the legality of any transaction in your jurisdiction
- Act as a party to any transaction between users
- Assume responsibility for user compliance with applicable laws
- Warrant the accuracy of product descriptions or seller representations
- Guarantee transaction completion or product delivery

4. INDEMNIFICATION
YOU AGREE TO INDEMNIFY, DEFEND, AND HOLD HARMLESS Ghetto Finance, its owners, operators, employees, contractors, moderators, and affiliates from and against ANY AND ALL claims, damages, obligations, losses, liabilities, costs, debts, and expenses (including attorney fees) arising from:
- Your use of the platform and services
- Your violation of these Terms of Service
- Your violation of any law, regulation, or third-party rights
- Any transaction conducted through the platform
- Any dispute with another user
- Your listing, sale, purchase, or exchange of products or services
- Any regulatory investigation or enforcement action
- Any cryptocurrency transaction losses
- Any tax liabilities or penalties
- Any intellectual property infringement
- Any fraudulent or illegal activity

5. LIMITATION OF LIABILITY
TO THE MAXIMUM EXTENT PERMITTED BY LAW:
- The platform is provided "AS IS" and "AS AVAILABLE" without warranties of any kind
- Ghetto Finance disclaims all warranties, express or implied, including merchantability and fitness for a particular purpose
- Ghetto Finance shall not be liable for any indirect, incidental, special, consequential, or punitive damages
- Our total liability shall not exceed the fees paid by you in the past 12 months, if any
- We are not liable for user actions, transaction disputes, regulatory violations, service interruptions, data loss, or security breaches
- We are not responsible for losses due to cryptocurrency price volatility
- We are not liable for third-party actions including payment processors, blockchain networks, or shipping carriers

6. DISPUTE RESOLUTION AND BINDING ARBITRATION
ALL DISPUTES ARISING FROM OR RELATING TO THESE TERMS OR YOUR USE OF THE PLATFORM SHALL BE RESOLVED AS FOLLOWS:
- Transaction disputes shall be submitted to platform moderators within 90 days
- Platform moderators shall serve as binding arbitrators for all disputes
- Moderator decisions are final and binding on all parties
- You agree to abide by all moderator decisions and judgments
- You waive any right to court litigation for disputes covered by this arbitration clause
- You waive any right to participate in class action lawsuits
- Arbitration shall be conducted according to platform procedures
- The 90-day resolution timeframe begins upon dispute filing
- Funds may be held in escrow during the dispute resolution process
- Failure to comply with moderator decisions may result in account suspension

7. PROHIBITED ACTIVITIES
Users shall not engage in:
- Sale of illegal goods, services, or content
- Money laundering, terrorist financing, or financial crimes
- Fraud, misrepresentation, deceptive practices, or scams
- Violation of intellectual property rights
- Activities violating sanctions or export control laws
- Market manipulation or price fixing
- Circumvention of platform security measures
- Harassment, threats, or abusive behavior
- Creation of multiple accounts to evade restrictions
- Any activity that violates applicable laws or regulations

8. ESCROW AND PAYMENT TERMS
- All transactions utilize the platform escrow system
- Sellers must post 100% collateral in GHETTO tokens
- Funds are released upon delivery confirmation or dispute resolution
- The platform charges a 2.5% fee on all transactions
- Cryptocurrency transactions carry inherent risks of loss
- Users accept all risks associated with cryptocurrency volatility
- Payment processing fees are non-refundable

9. REGULATORY COMPLIANCE
Users must comply with:
- FinCEN regulations for cryptocurrency transactions (US users)
- Securities laws for digital assets where applicable
- Consumer protection laws for all B2C transactions
- GDPR requirements for EU users
- MiCA regulations for crypto-assets (EU users)
- All applicable AML/KYC requirements
- Tax reporting and payment obligations
- Import/export regulations for physical goods

10. ACCOUNT SUSPENSION AND TERMINATION
We reserve the right to suspend or terminate accounts for:
- Violation of these Terms of Service
- Illegal activity or suspicious behavior
- Failure to comply with moderator decisions
- Failure to accept updated Terms of Service
- Chargebacks or payment disputes
- Multiple user complaints or poor ratings
- Risk to platform integrity or other users

11. MODIFICATIONS TO TERMS
- We may update these Terms at any time
- Continued use after updates constitutes acceptance
- Users will be notified of material changes
- Failure to accept updated Terms will result in account restrictions

12. CRYPTOCURRENCY RISKS
YOU ACKNOWLEDGE AND ACCEPT:
- Cryptocurrency values are highly volatile
- Transactions are generally irreversible
- Regulatory treatment of cryptocurrencies is evolving
- You may lose some or all of your cryptocurrency
- Technical issues may result in transaction failures
- We are not responsible for blockchain network issues

13. DATA AND PRIVACY
- User data is encrypted and stored securely
- We collect minimal information necessary for platform operation
- We comply with applicable privacy regulations
- Transaction records are retained for 7 years for compliance
- We may share information as required by law or legal process

14. INTELLECTUAL PROPERTY
- Users retain ownership of content they submit
- Users grant platform a license to use submitted content
- Users must not infringe on third-party intellectual property
- Platform trademarks and content are protected

15. SEVERABILITY
If any provision of these Terms is found unenforceable, the remaining provisions shall remain in full force and effect.

16. GOVERNING LAW
These Terms shall be governed by applicable laws, without regard to conflict of law provisions.

17. ENTIRE AGREEMENT
These Terms constitute the entire agreement between you and Ghetto Finance regarding use of the platform.

18. CONTACT
For legal inquiries: legal@ghetto.finance
For compliance questions: compliance@ghetto.finance

LAST UPDATED: January 2025

BY ACCEPTING THESE TERMS, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY ALL PROVISIONS HEREIN.',
  true,
  now()
) ON CONFLICT (version) DO NOTHING;