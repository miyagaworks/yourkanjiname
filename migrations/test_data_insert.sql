-- Test data for test2 and test3 partners
-- Run with: psql $DATABASE_URL -f migrations/test_data_insert.sql

-- First, get partner IDs
DO $$
DECLARE
  test2_id INT;
  test3_id INT;
  test2_sp_id INT;
  test3_sp_id INT;
BEGIN
  -- Get partner IDs
  SELECT id, salesperson_id INTO test2_id, test2_sp_id FROM partners WHERE code = 'test2';
  SELECT id, salesperson_id INTO test3_id, test3_sp_id FROM partners WHERE code = 'test3';

  IF test2_id IS NULL THEN
    RAISE NOTICE 'Partner test2 not found';
    RETURN;
  END IF;

  IF test3_id IS NULL THEN
    RAISE NOTICE 'Partner test3 not found';
    RETURN;
  END IF;

  RAISE NOTICE 'test2 ID: %, salesperson_id: %', test2_id, test2_sp_id;
  RAISE NOTICE 'test3 ID: %, salesperson_id: %', test3_id, test3_sp_id;

  -- Insert test payments for test2 (10 payments in January 2025)
  FOR i IN 1..10 LOOP
    INSERT INTO payments (
      stripe_payment_intent_id, amount, currency, status,
      partner_code, partner_id, customer_email, kanji_name, created_at
    ) VALUES (
      'pi_test2_jan_' || i || '_' || extract(epoch from now())::text,
      6.00, 'usd', 'succeeded',
      'test2', test2_id,
      'customer' || i || '@example.com',
      '太郎',
      '2025-01-' || LPAD(i::text, 2, '0') || ' 12:00:00'
    );
  END LOOP;

  -- Insert test payments for test2 (5 payments in February 2025)
  FOR i IN 1..5 LOOP
    INSERT INTO payments (
      stripe_payment_intent_id, amount, currency, status,
      partner_code, partner_id, customer_email, kanji_name, created_at
    ) VALUES (
      'pi_test2_feb_' || i || '_' || extract(epoch from now())::text,
      6.00, 'usd', 'succeeded',
      'test2', test2_id,
      'feb_customer' || i || '@example.com',
      '花子',
      '2025-02-' || LPAD(i::text, 2, '0') || ' 12:00:00'
    );
  END LOOP;

  -- Insert test payments for test3 (8 payments in January 2025)
  FOR i IN 1..8 LOOP
    INSERT INTO payments (
      stripe_payment_intent_id, amount, currency, status,
      partner_code, partner_id, customer_email, kanji_name, created_at
    ) VALUES (
      'pi_test3_jan_' || i || '_' || extract(epoch from now())::text,
      6.00, 'usd', 'succeeded',
      'test3', test3_id,
      'test3_customer' || i || '@example.com',
      '次郎',
      '2025-01-' || LPAD((i + 5)::text, 2, '0') || ' 14:00:00'
    );
  END LOOP;

  -- Insert test payments for test3 (3 payments in February 2025)
  FOR i IN 1..3 LOOP
    INSERT INTO payments (
      stripe_payment_intent_id, amount, currency, status,
      partner_code, partner_id, customer_email, kanji_name, created_at
    ) VALUES (
      'pi_test3_feb_' || i || '_' || extract(epoch from now())::text,
      6.00, 'usd', 'succeeded',
      'test3', test3_id,
      'test3_feb_customer' || i || '@example.com',
      '三郎',
      '2025-02-' || LPAD(i::text, 2, '0') || ' 14:00:00'
    );
  END LOOP;

  -- Update partner monthly stats for test2
  INSERT INTO partner_monthly_stats (partner_id, year_month, total_payments, total_revenue, royalty_amount, payout_status)
  VALUES
    (test2_id, '2025-01', 10, 60.00, 6.00, 'pending'),
    (test2_id, '2025-02', 5, 30.00, 3.00, 'pending')
  ON CONFLICT (partner_id, year_month) DO UPDATE SET
    total_payments = EXCLUDED.total_payments,
    total_revenue = EXCLUDED.total_revenue,
    royalty_amount = EXCLUDED.royalty_amount;

  -- Update partner monthly stats for test3
  INSERT INTO partner_monthly_stats (partner_id, year_month, total_payments, total_revenue, royalty_amount, payout_status)
  VALUES
    (test3_id, '2025-01', 8, 48.00, 4.80, 'pending'),
    (test3_id, '2025-02', 3, 18.00, 1.80, 'pending')
  ON CONFLICT (partner_id, year_month) DO UPDATE SET
    total_payments = EXCLUDED.total_payments,
    total_revenue = EXCLUDED.total_revenue,
    royalty_amount = EXCLUDED.royalty_amount;

  -- If test2 has a salesperson, add salesperson stats
  IF test2_sp_id IS NOT NULL THEN
    INSERT INTO salesperson_monthly_stats (salesperson_id, year_month, total_payments, total_revenue, royalty_amount, payout_status)
    VALUES
      (test2_sp_id, '2025-01', 10, 60.00, 6.00, 'pending'),
      (test2_sp_id, '2025-02', 5, 30.00, 3.00, 'pending')
    ON CONFLICT (salesperson_id, year_month) DO UPDATE SET
      total_payments = salesperson_monthly_stats.total_payments + EXCLUDED.total_payments,
      total_revenue = salesperson_monthly_stats.total_revenue + EXCLUDED.total_revenue,
      royalty_amount = salesperson_monthly_stats.royalty_amount + EXCLUDED.royalty_amount;
    RAISE NOTICE 'Added salesperson stats for test2 salesperson %', test2_sp_id;
  END IF;

  -- If test3 has a salesperson, add salesperson stats
  IF test3_sp_id IS NOT NULL THEN
    INSERT INTO salesperson_monthly_stats (salesperson_id, year_month, total_payments, total_revenue, royalty_amount, payout_status)
    VALUES
      (test3_sp_id, '2025-01', 8, 48.00, 4.80, 'pending'),
      (test3_sp_id, '2025-02', 3, 18.00, 1.80, 'pending')
    ON CONFLICT (salesperson_id, year_month) DO UPDATE SET
      total_payments = salesperson_monthly_stats.total_payments + EXCLUDED.total_payments,
      total_revenue = salesperson_monthly_stats.total_revenue + EXCLUDED.total_revenue,
      royalty_amount = salesperson_monthly_stats.royalty_amount + EXCLUDED.royalty_amount;
    RAISE NOTICE 'Added salesperson stats for test3 salesperson %', test3_sp_id;
  END IF;

  RAISE NOTICE 'Test data inserted successfully!';
  RAISE NOTICE 'test2: 10 payments (Jan) + 5 payments (Feb) = $90 total, $9 royalty';
  RAISE NOTICE 'test3: 8 payments (Jan) + 3 payments (Feb) = $66 total, $6.60 royalty';
END $$;

-- Show results
SELECT 'Partners:' as info;
SELECT code, name, royalty_rate, salesperson_id FROM partners WHERE code IN ('test2', 'test3');

SELECT 'Partner Monthly Stats:' as info;
SELECT p.code, pms.year_month, pms.total_payments, pms.total_revenue, pms.royalty_amount, pms.payout_status
FROM partner_monthly_stats pms
JOIN partners p ON pms.partner_id = p.id
WHERE p.code IN ('test2', 'test3')
ORDER BY p.code, pms.year_month;

SELECT 'Salesperson Monthly Stats (if any):' as info;
SELECT s.name, sms.year_month, sms.total_payments, sms.total_revenue, sms.royalty_amount, sms.payout_status
FROM salesperson_monthly_stats sms
JOIN salespersons s ON sms.salesperson_id = s.id
ORDER BY s.name, sms.year_month;
