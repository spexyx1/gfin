/*
  # Security Fix Part 1: Add Missing Foreign Key Indexes

  1. Changes
    - Add indexes for all unindexed foreign keys to improve query performance
    - This prevents suboptimal query performance when joining tables

  2. Tables Affected
    - api_request_logs
    - auto_moderation_logs
    - card_disputes
    - content_flags_queue
    - fraud_events
    - fraud_rules
    - kyc_verifications
    - merchant_api_keys
    - merchant_api_usage
    - merchant_card_enrollment
    - merchant_orders
    - merchant_sandbox_data
    - merchant_transactions
    - moderation_appeals
    - trusted_moderators
    - webhook_deliveries
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_api_request_logs_api_key_id ON public.api_request_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_auto_moderation_logs_reviewed_by ON public.auto_moderation_logs(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_card_disputes_resolved_by ON public.card_disputes(resolved_by);
CREATE INDEX IF NOT EXISTS idx_card_disputes_transaction_id ON public.card_disputes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_queue_assigned_to ON public.content_flags_queue(assigned_to);
CREATE INDEX IF NOT EXISTS idx_content_flags_queue_prohibited_category_id ON public.content_flags_queue(prohibited_category_id);
CREATE INDEX IF NOT EXISTS idx_fraud_events_resolved_by ON public.fraud_events(resolved_by);
CREATE INDEX IF NOT EXISTS idx_fraud_events_rule_id ON public.fraud_events(rule_id);
CREATE INDEX IF NOT EXISTS idx_fraud_events_transaction_id ON public.fraud_events(transaction_id);
CREATE INDEX IF NOT EXISTS idx_fraud_rules_created_by ON public.fraud_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_reviewer_id ON public.kyc_verifications(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_merchant_api_keys_created_by ON public.merchant_api_keys(created_by);
CREATE INDEX IF NOT EXISTS idx_merchant_api_keys_revoked_by ON public.merchant_api_keys(revoked_by);
CREATE INDEX IF NOT EXISTS idx_merchant_api_usage_merchant_id ON public.merchant_api_usage(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_card_enrollment_enrolled_by ON public.merchant_card_enrollment(enrolled_by);
CREATE INDEX IF NOT EXISTS idx_merchant_orders_api_key_id ON public.merchant_orders(api_key_id);
CREATE INDEX IF NOT EXISTS idx_merchant_sandbox_data_merchant_id ON public.merchant_sandbox_data(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_transactions_merchant_order_id ON public.merchant_transactions(merchant_order_id);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_original_report_id ON public.moderation_appeals(original_report_id);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_reviewed_by ON public.moderation_appeals(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_trusted_moderators_granted_by ON public.trusted_moderators(granted_by);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_merchant_id ON public.webhook_deliveries(merchant_id);
