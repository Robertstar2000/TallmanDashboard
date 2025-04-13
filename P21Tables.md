# P21 Database Tables

This document lists tables found in the P21Play database, organized by category.
Each table includes its schema, name, and columns with their data types.

*Generated on: 3/28/2025, 8:46:09 AM*

## Table of Contents

- [Accounts](#accounts)
- [Historical Data](#historical-data)
- [Inventory](#inventory)
- [Key Metrics](#key-metrics)
- [POR Overview](#por-overview)
- [Web Orders](#web-orders)
- [Other](#other)

## Accounts

### Table Summary

| Schema | Table Name |
|--------|------------|
| dbo | account_group_hdr |
| dbo | account_group_line |
| dbo | account_x_currency |
| dbo | address_CAD_target_audit |
| dbo | address_CUCO_target_audit |
| dbo | address_CUS_target_audit |
| dbo | ads_audit_accounting_ar |
| dbo | affinity_hierarchy |
| dbo | alarm_code |
| dbo | alarm_code_x_inv_mast |
| dbo | ap_system_parameters |
| dbo | apc_ecommerce_price_archive |
| dbo | apc_inventory_master_data |
| dbo | apc_replenishment_settings_archive |
| dbo | apc_sporadic_item_matrix |
| dbo | api_data_access_x_roles |
| dbo | apinv_hdr |
| dbo | apinv_hdr_174 |
| dbo | apinv_hdr_audit_trail |
| dbo | apinv_hdr_edit |
| dbo | apinv_hdr_edit_audit_trail |
| dbo | apinv_hdr_not_delete |
| dbo | apinv_hdr_vat |
| dbo | apinv_hdr_x_inventory_receipts |
| dbo | apinv_line |
| dbo | apinv_line_audit_trail |
| dbo | apinv_line_disputed_vouch |
| dbo | apinv_line_edit |
| dbo | apinv_line_edit_audit_trail |
| dbo | apinv_line_x_inv_receipts_line |
| dbo | application_resource_file |
| dbo | application_security |
| dbo | appointment |
| dbo | appointment_exception |
| dbo | ar_allowed_amt_distribution |
| dbo | ar_payment_details |
| dbo | ar_receipts |
| dbo | ar_receipts_detail |
| dbo | ar_system_parameters |
| dbo | area |
| dbo | area_x_custom_column |
| dbo | assembly_hdr_STK_target_audit |
| dbo | assembly_line_STK_target_audit |
| dbo | auto_test_saved_vars_dtl |
| dbo | auto_test_saved_vars_hdr |
| dbo | b2b_temp_credit_card |
| dbo | b2b_temp_creditcard_processor |
| dbo | b2b_temp_creditcard_processor_x_location |
| dbo | b2b_temp_item_category_hierarchy |
| dbo | b2b_temp_rewards_program |
| dbo | b2b_temp_rewards_program_entry_form |
| dbo | b2b_temp_rewards_program_entry_goal |
| dbo | b2b_temp_rewards_program_entry_year |
| dbo | b2b_temp_warranty_claim_dealer_failure_code |
| dbo | b2b_temp_warranty_claim_dealer_failure_code_x_supplier |
| dbo | b2b_temp_warranty_claim_item_detail |
| dbo | b2b_temp_warranty_claim_item_equipment |
| dbo | b2b_temp_warranty_claim_product_group_detail |
| dbo | b2b_temp_warranty_claim_product_group_equipment |
| dbo | b2b_temp_warranty_claim_product_group_serial_template |
| dbo | b2b_temp_warranty_claim_supplier_claim_detail |
| dbo | b2b_temp_warranty_claim_supplier_detail |
| dbo | bank_accounts |
| dbo | bank_accounts_eft |
| dbo | bank_accounts_reconciliation |
| dbo | bank_accounts_reconciliation_audit_trail |
| dbo | buy_get_x_rewards_program |
| dbo | calendar_based_delivery |
| dbo | calendar_based_reading_hist |
| dbo | calendar_measure_10005 |
| dbo | cardlock_tax_type |
| dbo | carrier |
| dbo | carrier_194 |
| dbo | carrier_2164 |
| dbo | carrier_analytics_contract_pricing |
| dbo | carrier_analytics_item_pricing |
| dbo | carrier_bill_of_lading |
| dbo | carrier_contract_hdr |
| dbo | carrier_contract_line |
| dbo | carrier_contract_qty_used_hist |
| dbo | carrier_contract_ship_to |
| dbo | carrier_contract_z_line |
| dbo | carrier_cube_factor |
| dbo | carrier_cube_modifier |
| dbo | carrier_data |
| dbo | carrier_data_detail |
| dbo | carrier_data_x_package |
| dbo | carrier_data_x_shipment |
| dbo | carrier_info |
| dbo | carrier_integration_direct_ship_data |
| dbo | carrier_package_type |
| dbo | carrier_pick_location |
| dbo | carrier_pick_location_zone |
| dbo | carrier_priority |
| dbo | carrier_provider_type |
| dbo | carrier_reference |
| dbo | carrier_service_type |
| dbo | carrier_ship_method |
| dbo | carrier_ship_via |
| dbo | carrier_shipping_charge |
| dbo | carrier_shipping_document |
| dbo | carrier_size_category_cube_factor |
| dbo | carrier_size_category_cube_modifier |
| dbo | carrier_x_freight_code |
| dbo | cartaporte_cfdi |
| dbo | cartaporte_detail |
| dbo | cartaporte_hdr |
| dbo | cartaporte_hdr_x_document |
| dbo | cartaporte_hdr_x_driver |
| dbo | cartaporte_hdr_x_location |
| dbo | cartaporte_hdr_x_trailer |
| dbo | castrol_trans_summary |
| dbo | cc_payment_type_x_processor |
| dbo | cfdi_payment_receipts_line |
| dbo | chart_of_accts |
| dbo | chart_of_accts_edi |
| dbo | chart_of_accts_ud |
| dbo | check_payment_details |
| dbo | class_STK_target_audit |
| dbo | comm_defaults_days_overdue |
| dbo | company_ar_info |
| dbo | company_cost_var_info |
| dbo | contacts_CUCO_target_audit |
| dbo | contacts_x_ship_to_CUCO_target_audit |
| dbo | coop_gl_account |
| dbo | copy_table_data_x_argument |
| dbo | copy_table_data_x_argument_val |
| dbo | cpa_gl_account_excluded_x_branch |
| dbo | cpa_indirect_cost_x_gl_account |
| dbo | cpa_scorecard_configuration |
| dbo | creditcard_emv |
| dbo | creditcard_emv_tags |
| dbo | creditcard_payment_details |
| dbo | creditcard_proc_comp_user |
| dbo | creditcard_processor |
| dbo | creditcard_processor_x_users |
| dbo | creditcard_signature |
| dbo | creditcard_transaction_receipt |
| dbo | creditcard_transrequest |
| dbo | creditcard_transresponse |
| dbo | creditcard_transtype |
| dbo | creditcard_validation |
| dbo | currency_variance_account |
| dbo | cust_part_no_group_hdr |
| dbo | cust_part_no_group_line |
| dbo | cust_part_no_notepad |
| dbo | customs_declaration_mx |
| dbo | datatypes_with_no_parens |
| dbo | dealer_commission_payments |
| dbo | dealer_warranty_failure_code |
| dbo | departments |
| dbo | deployed_map |
| dbo | deployed_maps_mft |
| dbo | direction_recent_search |
| dbo | discount_group_x_rewards_program |
| dbo | document_link_area |
| dbo | document_link_docstar |
| dbo | document_summary |
| dbo | downpayment_refund_details |
| dbo | ecc_custom_column_mapping |
| dbo | ecc_custom_column_mapping_x_column |
| dbo | eh_mro_api_log |
| dbo | enterprise_search |
| dbo | epayment_response_code_info |
| dbo | epf_merchant_account |
| dbo | epf_merchant_account_options |
| dbo | epf_payment_type_mapping |
| dbo | epf_processor_account |
| dbo | epic_cart |
| dbo | fault_tolerance_area_code |
| dbo | fedex_smartpost_hub |
| dbo | field_chooser_area |
| dbo | fifo_layers_STK_target_audit |
| dbo | finance_charge_cycle |
| dbo | form_destination_hierarchy |
| dbo | freight_charge |
| dbo | freight_charge_break |
| dbo | freight_charge_by_mile_dtl |
| dbo | freight_charge_by_mile_hdr |
| dbo | freight_charge_carrier |
| dbo | freight_group_charge |
| dbo | gl_system_parameters |
| dbo | import_restart_file |
| dbo | import_restart_hdr |
| dbo | import_restart_requestor |
| dbo | incoming_freight_charge |
| dbo | inv_accessory_ALT_target_audit |
| dbo | inv_bin_STK_target_audit |
| dbo | inv_hdr_dealer_warranty |
| dbo | inv_line_dealer_warranty |
| dbo | inv_loc_STK_target_audit |
| dbo | inv_mast_dealer_warranty |
| dbo | inv_mast_dealer_warranty_equip |
| dbo | inv_mast_language_STT_target_audit |
| dbo | inv_mast_links_STK_target_audit |
| dbo | inv_mast_links_STT_target_audit |
| dbo | inv_mast_SGP_target_audit |
| dbo | inv_mast_STK_target_audit |
| dbo | inv_mast_x_company_STK_target_audit |
| dbo | inv_mast_x_rewards_program |
| dbo | inv_sub_ALT_target_audit |
| dbo | inv_system_parameters |
| dbo | inventory_card |
| dbo | inventory_issues_date_summary |
| dbo | inventory_issues_document_summary |
| dbo | inventory_supplier_STK_target_audit |
| dbo | inventory_supplier_x_loc_STK_target_audit |
| dbo | inventory_value_analysis_accounttable |
| dbo | inventory_value_analysis_accounttable_all |
| dbo | inventory_value_analysis_accounttable_differences |
| dbo | inventory_value_analysis_accounttable_summary |
| dbo | item_category_hierarchy |
| dbo | item_category_hierarchy_delete_audit |
| dbo | item_service_part_list |
| dbo | item_warranty |
| dbo | item_warranty_x_warranty |
| dbo | item_warranty_x_warranty_reason |
| dbo | loan_surcharge |
| dbo | location_other_charge |
| dbo | location_supplier_STK_target_audit |
| dbo | marketing_campaign_detail |
| dbo | mcc_code_hierarchy_hdr |
| dbo | mcc_code_hierarchy_line |
| dbo | mexico_creditcard_info |
| dbo | note_area |
| dbo | note_display_area |
| dbo | oe_auxiliary_194 |
| dbo | oe_buy_get_rewards |
| dbo | oe_hdr_cardlock |
| dbo | oe_hdr_x_price_library |
| dbo | oe_line_buy_get_rewards |
| dbo | oe_line_rewards |
| dbo | oe_line_secondary_rebate |
| dbo | oe_line_service_part |
| dbo | oe_line_service_warranty |
| dbo | oe_line_supplier_charges |
| dbo | oe_location_carrier |
| dbo | oe_pick_ticket_frt_charges |
| dbo | oe_system_parameters |
| dbo | p21_docstar_inbound_log |
| dbo | p21_docstar_outbound_log |
| dbo | p21_mapper_translation_table |
| dbo | p21_price_engine_hierarchy |
| dbo | p21_price_engine_run_carrier_contract_line |
| dbo | p21_price_engine_run_carrier_contract_z_line |
| dbo | p21_price_engine_run_library |
| dbo | part_type_trade |
| dbo | partner_program |
| dbo | payable_group |
| dbo | payment_1099_detail |
| dbo | payment_account |
| dbo | payment_account_detail |
| dbo | payment_account_request_to_delete |
| dbo | payment_account_x_contact |
| dbo | payment_account_x_ship_to |
| dbo | payment_account_x_transaction |
| dbo | payment_cfdi_additional_info |
| dbo | payment_cfdi_override |
| dbo | payment_detail |
| dbo | payment_detail_iva |
| dbo | payment_method_mx |
| dbo | payment_methods |
| dbo | payment_type_mx |
| dbo | payment_types |
| dbo | payment_types_335 |
| dbo | payment_types_x_payment_type_mx |
| dbo | payments |
| dbo | payments_audit_trail |
| dbo | pc_app_def |
| dbo | pegmost_account |
| dbo | pending_payments |
| dbo | pl_app_extend |
| dbo | po_system_parameters |
| dbo | pool_shape |
| dbo | portal_param_def |
| dbo | portal_param_value |
| dbo | price_book_x_library |
| dbo | price_family_x_rewards_program |
| dbo | price_library |
| dbo | price_library_x_cust_x_cmpy |
| dbo | price_page_custpart |
| dbo | price_page_secondary_rebate |
| dbo | pricing_service_map |
| dbo | process_system_parameters |
| dbo | prod_group_dealer_warranty |
| dbo | prod_group_dealer_warranty_equip |
| dbo | prod_group_dealer_warranty_serial |
| dbo | product_group_x_rewards_program |
| dbo | purchase_price_library |
| dbo | purchase_price_library_detail |
| dbo | quarter |
| dbo | reapplied_payment_line |
| dbo | rebate_payments_detail |
| dbo | receivable_group |
| dbo | recur_apinv_hdr |
| dbo | recur_apinv_line |
| dbo | report_parameter |
| dbo | report_parameter_group |
| dbo | report_parameter_x_group |
| dbo | report_parm |
| dbo | research_tracking_hdr |
| dbo | research_tracking_line |
| dbo | restate_accounts_hdr |
| dbo | restate_accounts_line |
| dbo | reverse_payment_hdr |
| dbo | reverse_payment_line |
| dbo | review_lockbox_payment_import_hdr |
| dbo | review_lockbox_payment_import_line |
| dbo | rewards_program |
| dbo | rewards_program_entry_form |
| dbo | rewards_program_entry_goal |
| dbo | rewards_program_entry_year |
| dbo | rewards_program_x_accrued_claims |
| dbo | rma_line_carrier_contract_info |
| dbo | rma_x_cc_payments |
| dbo | rma_x_cc_payments_freight |
| dbo | room_area |
| dbo | sat_payment_transfer_mx |
| dbo | service_calendar |
| dbo | service_inv_mast_part_list |
| dbo | service_inv_warranty |
| dbo | service_inv_warranty_labor |
| dbo | service_inv_warranty_part |
| dbo | service_labor_rate_x_partner_program |
| dbo | service_warranty |
| dbo | service_warranty_claim |
| dbo | service_warranty_item |
| dbo | service_warranty_labor |
| dbo | service_warranty_part |
| dbo | ship_to_3rd_party_carriers_194 |
| dbo | ship_to_CAD_target_audit |
| dbo | ship_to_cardlock |
| dbo | ship_to_CUCO_target_audit |
| dbo | ship_to_CUS_target_audit |
| dbo | ship_to_finance_charge |
| dbo | shipping_charges |
| dbo | shipto_carrier |
| dbo | shopping_cart_allocation |
| dbo | signature_capture |
| dbo | statistical_account_hdr |
| dbo | statistical_account_line |
| dbo | summary_po_loc_daily |
| dbo | summary_po_loc_monthly |
| dbo | supplier_charges |
| dbo | supplier_dealer_warr_dtl |
| dbo | supplier_STK_target_audit |
| dbo | supplier_surcharge |
| dbo | supplier_x_rewards_program |
| dbo | sys_params_p21 |
| dbo | system_parameters |
| dbo | task_area_x_user |
| dbo | task_auxiliary_assignee |
| dbo | task_auxiliary_contact |
| dbo | temp_billtrust_statement_artb_app |
| dbo | temp_billtrust_statement_fax_email_app |
| dbo | temp_billtrust_statement_output_data_app |
| dbo | temp_billtrust_statement_variables_app |
| dbo | temp_po_loc_summary |
| dbo | temp_statement_queries_app |
| dbo | thirdpartybill_filetype |
| dbo | thirdpartybill_output_file |
| dbo | tpcx_trading_partner |
| dbo | transaction_charge |
| dbo | tripos_lane_mapping |
| dbo | tropic_cardex_po_eval |
| dbo | tropic_cardex_setup |
| dbo | ud_tabpage_parameter |
| dbo | unit_of_measure_STK_target_audit |
| dbo | upos_device_mapping |
| dbo | users_x_application_security |
| dbo | vendor_asb_subaccounts |
| dbo | vendor_contract_hierarchy |
| dbo | vendor_dealer_warranty |
| dbo | voucher_deletion_apinv_hdr |
| dbo | voucher_deletion_payments |
| dbo | warranty |
| dbo | warranty_claim_detail |
| dbo | warranty_claim_hdr |
| dbo | warranty_claim_payments |
| dbo | warranty_claim_receipts |
| dbo | warranty_reason |
| dbo | warranty_state_req |
| dbo | weboe_ar_transaction_data |
| dbo | weboe_open_account_balance_data |
| dbo | weboe_variable_data |
| dbo | wzd_app_p21 |
| dbo | xm_api_inbound_log |
| dbo | xm_api_outbound_log |
| dbo | year_control |
| ssb | trig_apinv_hdr |
| ssb | trig_apinv_hdr_edit |
| ssb | trig_apinv_line |
| ssb | trig_apinv_line_edit |
| ssb | trig_bank_accounts_reconciliation |
| ssb | trig_payments |

### Detailed Table Information

#### dbo.account_group_hdr

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| account_group_hdr_uid | int |  | NO |
| company_id | varchar | 8 | NO |
| account_group_id | varchar | 255 | NO |
| account_group_desc | varchar | 255 | NO |
| row_status_flag | int |  | NO |
| date_created | datetime |  | NO |
| created_by | varchar | 255 | NO |
| date_last_modified | datetime |  | NO |
| last_maintained_by | varchar | 255 | NO |

#### dbo.account_group_line

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| account_group_line_uid | int |  | NO |
| account_group_hdr_uid | int |  | NO |
| chart_of_accts_uid | int |  | NO |
| row_status_flag | int |  | NO |
| date_created | datetime |  | NO |
| created_by | varchar | 255 | NO |
| date_last_modified | datetime |  | NO |
| last_maintained_by | varchar | 255 | NO |

#### dbo.account_x_currency

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| account_x_currency_uid | int |  | NO |
| company_id | varchar | 8 | NO |
| account_no | varchar | 32 | NO |
| currency_id | decimal |  | NO |
| account_type_cd | int |  | NO |
| row_status_flag | int |  | NO |
| date_created | datetime |  | NO |
| created_by | varchar | 255 | NO |
| date_last_modified | datetime |  | NO |
| last_maintained_by | varchar | 255 | NO |

#### dbo.address_CAD_target_audit

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| address_CAD_target_audit_uid | int |  | NO |
| address_id | int |  | NO |
| msg_uid | uniqueidentifier |  | NO |
| name | varchar | 50 | YES |
| old_name | varchar | 50 | YES |
| mail_address1 | varchar | 50 | YES |
| old_mail_address1 | varchar | 50 | YES |
| mail_address2 | varchar | 50 | YES |
| old_mail_address2 | varchar | 50 | YES |
| mail_address3 | varchar | 50 | YES |
| old_mail_address3 | varchar | 50 | YES |
| mail_city | varchar | 50 | YES |
| old_mail_city | varchar | 50 | YES |
| mail_state | varchar | 50 | YES |
| old_mail_state | varchar | 50 | YES |
| mail_country | varchar | 50 | YES |
| old_mail_country | varchar | 50 | YES |
| mail_postal_code | varchar | 10 | YES |
| old_mail_postal_code | varchar | 10 | YES |
| phys_address1 | varchar | 50 | YES |
| old_phys_address1 | varchar | 50 | YES |
| phys_address2 | varchar | 50 | YES |
| old_phys_address2 | varchar | 50 | YES |
| phys_address3 | varchar | 50 | YES |
| old_phys_address3 | varchar | 50 | YES |
| phys_city | varchar | 50 | YES |
| old_phys_city | varchar | 50 | YES |
| phys_state | varchar | 50 | YES |
| old_phys_state | varchar | 50 | YES |
| phys_country | varchar | 50 | YES |
| old_phys_country | varchar | 50 | YES |
| phys_postal_code | varchar | 10 | YES |
| old_phys_postal_code | varchar | 10 | YES |
| central_phone_number | varchar | 20 | YES |
| old_central_phone_number | varchar | 20 | YES |
| central_fax_number | varchar | 20 | YES |
| old_central_fax_number | varchar | 20 | YES |
| delete_flag | char | 1 | YES |
| old_delete_flag | char | 1 | YES |
| preferred_location_id | int |  | YES |
| old_preferred_location_id | int |  | YES |
| email_address | varchar | 255 | YES |
| old_email_address | varchar | 255 | YES |
| date_last_modified | datetime |  | NO |

#### dbo.address_CUCO_target_audit

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| address_CUCO_target_audit_uid | int |  | NO |
| address_id | int |  | NO |
| msg_uid | uniqueidentifier |  | NO |
| phys_address1 | varchar | 50 | YES |
| old_phys_address1 | varchar | 50 | YES |
| phys_address2 | varchar | 50 | YES |
| old_phys_address2 | varchar | 50 | YES |
| phys_address3 | varchar | 50 | YES |
| old_phys_address3 | varchar | 50 | YES |
| phys_city | varchar | 50 | YES |
| old_phys_city | varchar | 50 | YES |
| phys_state | varchar | 50 | YES |
| old_phys_state | varchar | 50 | YES |
| phys_country | varchar | 50 | YES |
| old_phys_country | varchar | 50 | YES |
| phys_postal_code | varchar | 10 | YES |
| old_phys_postal_code | varchar | 10 | YES |
| date_last_modified | datetime |  | NO |

*Note: Only showing details for the first 5 tables in this category. 390 more tables exist.*

## Historical Data

### Table Summary

| Schema | Table Name |
|--------|------------|
| dbo | address_history |
| dbo | b2b_temp_past_purchases |
| dbo | buying_trend_final_form |
| dbo | buying_trend_history |
| dbo | buying_trend_normality |
| dbo | cash_drawer_history |
| dbo | conoco_export_history |
| dbo | fifo_layer_cost_history |
| dbo | inv_adj_line_recount_history |
| dbo | inv_issues_belting_history |
| dbo | inv_sub_history |
| dbo | inventory_value_items_history |
| dbo | item_id_change_history |
| dbo | moving_avg_cost_history |
| dbo | pegmost_export_history |
| dbo | scheduled_job_history |
| dbo | temp_inventory_usage_rebuild_history |
| dbo | temp_rescale_uom_history |
| dbo | temp_weboe_item_history_info |
| dbo | valvoline_export_history |
| dbo | weboe_audit_trail_detail_history |
| dbo | weboe_audit_trail_hdr_history |

### Detailed Table Information

#### dbo.address_history

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| address_history_uid | int |  | NO |
| customer_name | varchar | 50 | YES |
| contact_name | varchar | 30 | YES |
| address1 | varchar | 50 | YES |
| address2 | varchar | 50 | YES |
| state | varchar | 50 | YES |
| postal_code | char | 10 | YES |
| country | varchar | 50 | YES |
| date_created | datetime |  | NO |
| date_last_modified | datetime |  | NO |
| last_maintained_by | varchar | 30 | NO |
| city | varchar | 50 | YES |
| address3 | varchar | 50 | YES |

#### dbo.b2b_temp_past_purchases

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| b2b_temp_past_purchases_uid | int |  | NO |
| customer_id | varchar | 20 | NO |
| item_id | varchar | 40 | NO |
| item_desc | varchar | 40 | YES |
| sales_unit | varchar | 10 | NO |
| sales_size | decimal |  | NO |
| customer_part_number | varchar | 40 | YES |

#### dbo.buying_trend_final_form

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| buying_trend_final_form_uid | int |  | NO |
| customer_id | decimal |  | NO |
| inv_mast_uid | int |  | NO |
| bucket_type | smallint |  | NO |
| normal | char | 1 | YES |
| upper_spec_limit | decimal |  | YES |
| lower_spec_limit | decimal |  | YES |
| ad_stat | decimal |  | YES |
| last_bucket_qty | decimal |  | YES |
| mean_bucket_qty | decimal |  | YES |
| stdev_bucket_qty | decimal |  | YES |
| last_each_price | decimal |  | YES |
| date_created | datetime |  | NO |
| date_last_modified | datetime |  | NO |
| company_id | varchar | 8 | YES |

#### dbo.buying_trend_history

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| buying_trend_history_uid | int |  | NO |
| company_id | varchar | 8 | NO |
| customer_id | decimal |  | NO |
| inv_mast_uid | int |  | NO |
| lower_spec_limit | decimal |  | NO |
| last_bucket_qty | decimal |  | NO |
| last_each_price | decimal |  | NO |
| date_created | datetime |  | NO |

#### dbo.buying_trend_normality

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| buying_trend_normality_uid | int |  | NO |
| bucket_number | smallint |  | NO |
| customer_id | decimal |  | NO |
| inv_mast_uid | int |  | NO |
| bucket_qty | decimal |  | YES |
| bucket_type | smallint |  | YES |
| f1i | decimal |  | YES |
| 1-f1i | decimal |  | YES |
| f2i | decimal |  | YES |
| si | decimal |  | YES |
| company_id | varchar | 8 | YES |

*Note: Only showing details for the first 5 tables in this category. 17 more tables exist.*

## Inventory

### Table Summary

| Schema | Table Name |
|--------|------------|
| dbo | average_inventory_value |
| dbo | b2b_temp_category_x_item |
| dbo | b2b_temp_cust_item |
| dbo | b2b_temp_inventory_cross_reference |
| dbo | b2b_temp_item |
| dbo | b2b_temp_item_alternate |
| dbo | b2b_temp_item_category |
| dbo | b2b_temp_item_category_description |
| dbo | b2b_temp_item_document |
| dbo | b2b_temp_item_image |
| dbo | b2b_temp_item_location |
| dbo | b2b_temp_item_location_bin |
| dbo | b2b_temp_item_notepad |
| dbo | b2b_temp_item_price_contract |
| dbo | b2b_temp_item_spec_page |
| dbo | b2b_temp_item_substitute |
| dbo | b2b_temp_item_supplier_x_location |
| dbo | b2b_temp_item_uom |
| dbo | b2b_temp_product_group |
| dbo | bill_to_category_items |
| dbo | box_item_x_each_item |
| dbo | branch_inv_no_display |
| dbo | cancel_pick_ticket_item |
| dbo | company_inv_no_display |
| dbo | copy_item_sql |
| dbo | copy_item_table |
| dbo | credinv_x_invhdr_x_fcinv |
| dbo | cust_x_inv_loc_edi32_discontinued_sent |
| dbo | cust_x_inv_mast_edi846 |
| dbo | cust_x_invsupplier_freight |
| dbo | document_line_inv_xref_dtl |
| dbo | document_line_inv_xref_hdr |
| dbo | drp_item_selection_criteria |
| dbo | ecc_p21_get_items_xml |
| dbo | ecc_p21_get_items_xml_work |
| dbo | ecc_ship_to_x_inv_mast_delete |
| dbo | error_log_autocreate_invreturn |
| dbo | fascor_invdiscrepancy |
| dbo | fbff_forecasts_per_item_location_formula |
| dbo | fbff_sum_error_per_item_location_formula |
| dbo | for_inv_mast |
| dbo | for_item_category |
| dbo | for_item_category_text |
| dbo | gpor_item_limiter |
| dbo | group_po_receiving_items |
| dbo | inv_accessory |
| dbo | inv_accessory_ALT_initiator_audit |
| dbo | inv_adj_hdr |
| dbo | inv_adj_hdr_audit_trail |
| dbo | inv_adj_line |
| dbo | inv_adj_line_audit_trail |
| dbo | inv_adj_loc_attribute_group |
| dbo | inv_alloc_trans |
| dbo | inv_bin |
| dbo | inv_bin_audit |
| dbo | inv_bin_deletion_inv_bin_hdr |
| dbo | inv_bin_hdr_not_delete |
| dbo | inv_bin_STK_initiator_audit |
| dbo | inv_cost_edit |
| dbo | inv_cost_edit_audit_trail |
| dbo | inv_excise_tax |
| dbo | inv_group_hdr |
| dbo | inv_group_loc_allocation |
| dbo | inv_group_region |
| dbo | inv_group_region_loc |
| dbo | inv_hdr_x_fc_inv |
| dbo | inv_hdr_x_supplier_detail |
| dbo | inv_loc |
| dbo | inv_loc_additional_price |
| dbo | inv_loc_aqnet |
| dbo | inv_loc_cust_reserve |
| dbo | inv_loc_expedite_time |
| dbo | inv_loc_gtor_ns |
| dbo | inv_loc_msp |
| dbo | inv_loc_price_multiplier |
| dbo | inv_loc_price_protection |
| dbo | inv_loc_STK_initiator_audit |
| dbo | inv_loc_stock_status |
| dbo | inv_loc_ud |
| dbo | inv_mast |
| dbo | inv_mast_15 |
| dbo | inv_mast_194 |
| dbo | inv_mast_2164 |
| dbo | inv_mast_219 |
| dbo | inv_mast_335 |
| dbo | inv_mast_additional_price |
| dbo | inv_mast_assem_info |
| dbo | inv_mast_core |
| dbo | inv_mast_coredisc |
| dbo | inv_mast_damaged |
| dbo | inv_mast_damaged_documents |
| dbo | inv_mast_damaged_image |
| dbo | inv_mast_dea |
| dbo | inv_mast_default |
| dbo | inv_mast_default_x_company |
| dbo | inv_mast_document |
| dbo | inv_mast_eco_fee |
| dbo | inv_mast_equip |
| dbo | inv_mast_freight_option |
| dbo | inv_mast_intrastat |
| dbo | inv_mast_labels |
| dbo | inv_mast_language |
| dbo | inv_mast_language_STT_initiator_audit |
| dbo | inv_mast_lifo_pool |
| dbo | inv_mast_links |
| dbo | inv_mast_links_STK_initiator_audit |
| dbo | inv_mast_links_STT_initiator_audit |
| dbo | inv_mast_lot |
| dbo | inv_mast_msds |
| dbo | inv_mast_state_tax |
| dbo | inv_mast_STK_initiator_audit |
| dbo | inv_mast_strategic_pricing |
| dbo | inv_mast_taxinfo |
| dbo | inv_mast_tire_proration |
| dbo | inv_mast_trackabout |
| dbo | inv_mast_trade |
| dbo | inv_mast_ud |
| dbo | inv_mast_web_desc |
| dbo | inv_mast_x_company |
| dbo | inv_mast_x_company_STK_initiator_audit |
| dbo | inv_mast_x_product_service_mx |
| dbo | inv_mast_x_restricted_class |
| dbo | inv_on_hand |
| dbo | inv_period_usage |
| dbo | inv_period_usage_temp |
| dbo | inv_ranking_criteria |
| dbo | inv_reclassification_detail |
| dbo | inv_reclassification_work |
| dbo | inv_sub |
| dbo | inv_sub_ALT_initiator_audit |
| dbo | inv_supp_auto_update_price |
| dbo | inv_supplier_x_loc_pricing |
| dbo | inv_tran |
| dbo | inv_tran_bin_detail |
| dbo | inv_tran_lot_detail |
| dbo | inv_tran_serial_detail |
| dbo | inv_xref |
| dbo | inv_xref_230 |
| dbo | inv_xref_741 |
| dbo | inv_xref_supplier_info |
| dbo | inv_xref_udf |
| dbo | inventory_cross_reference |
| dbo | inventory_defaults |
| dbo | inventory_defaults_335 |
| dbo | inventory_issues_audit |
| dbo | inventory_issues_item_loc |
| dbo | inventory_issues_item_table |
| dbo | inventory_issues_return_row |
| dbo | inventory_links |
| dbo | inventory_movement |
| dbo | inventory_movement_deposit |
| dbo | inventory_movement_deposit_log |
| dbo | inventory_movement_error_log |
| dbo | inventory_movement_pick_bin |
| dbo | inventory_receipt_attribute_value |
| dbo | inventory_receipt_location |
| dbo | inventory_receipt_notepad |
| dbo | inventory_receipts_hdr |
| dbo | inventory_receipts_hdr_1348 |
| dbo | inventory_receipts_line |
| dbo | inventory_receipts_line_issue |
| dbo | inventory_return_hdr |
| dbo | inventory_return_hdr_notepad |
| dbo | inventory_return_hdr_x_jc_job |
| dbo | inventory_return_line |
| dbo | inventory_return_line_notepad |
| dbo | inventory_supplier |
| dbo | inventory_supplier_1348 |
| dbo | inventory_supplier_31 |
| dbo | inventory_supplier_ext |
| dbo | inventory_supplier_package_info |
| dbo | inventory_supplier_pricing |
| dbo | inventory_supplier_STK_initiator_audit |
| dbo | inventory_supplier_trade |
| dbo | inventory_supplier_x_loc |
| dbo | inventory_supplier_x_loc_STK_initiator_audit |
| dbo | inventory_supplier_x_uom |
| dbo | inventory_value_items |
| dbo | inventory_value_location |
| dbo | inventory_value_review_branch |
| dbo | inventory_value_review_company |
| dbo | inventoryissuesrebuilds |
| dbo | InventoryIssuesResults1 |
| dbo | InventoryIssuesResults10 |
| dbo | InventoryIssuesResults11 |
| dbo | InventoryIssuesResults12 |
| dbo | InventoryIssuesResults13 |
| dbo | InventoryIssuesResults14 |
| dbo | InventoryIssuesResults15 |
| dbo | InventoryIssuesResults16 |
| dbo | InventoryIssuesResults17 |
| dbo | InventoryIssuesResults18 |
| dbo | InventoryIssuesResults19 |
| dbo | InventoryIssuesResults2 |
| dbo | InventoryIssuesResults20 |
| dbo | InventoryIssuesResults21 |
| dbo | InventoryIssuesResults22 |
| dbo | InventoryIssuesResults23 |
| dbo | InventoryIssuesResults24 |
| dbo | InventoryIssuesResults25 |
| dbo | InventoryIssuesResults26 |
| dbo | InventoryIssuesResults27 |
| dbo | InventoryIssuesResults28 |
| dbo | InventoryIssuesResults29 |
| dbo | InventoryIssuesResults3 |
| dbo | InventoryIssuesResults30 |
| dbo | InventoryIssuesResults31 |
| dbo | InventoryIssuesResults32 |
| dbo | InventoryIssuesResults33 |
| dbo | InventoryIssuesResults34 |
| dbo | InventoryIssuesResults35 |
| dbo | InventoryIssuesResults36 |
| dbo | InventoryIssuesResults37 |
| dbo | InventoryIssuesResults38 |
| dbo | InventoryIssuesResults39 |
| dbo | InventoryIssuesResults4 |
| dbo | InventoryIssuesResults40 |
| dbo | InventoryIssuesResults41 |
| dbo | InventoryIssuesResults42 |
| dbo | InventoryIssuesResults43 |
| dbo | InventoryIssuesResults44 |
| dbo | InventoryIssuesResults45 |
| dbo | InventoryIssuesResults46 |
| dbo | InventoryIssuesResults47 |
| dbo | InventoryIssuesResults48 |
| dbo | InventoryIssuesResults49 |
| dbo | InventoryIssuesResults5 |
| dbo | InventoryIssuesResults50 |
| dbo | InventoryIssuesResults51 |
| dbo | InventoryIssuesResults52 |
| dbo | InventoryIssuesResults53 |
| dbo | InventoryIssuesResults54 |
| dbo | InventoryIssuesResults55 |
| dbo | InventoryIssuesResults56 |
| dbo | InventoryIssuesResults6 |
| dbo | inventoryissuesresults64 |
| dbo | inventoryissuesresults65 |
| dbo | inventoryissuesresults66 |
| dbo | inventoryissuesresults67 |
| dbo | inventoryissuesresults68 |
| dbo | inventoryissuesresults69 |
| dbo | InventoryIssuesResults7 |
| dbo | InventoryIssuesResults70 |
| dbo | InventoryIssuesResults71 |
| dbo | inventoryissuesresults72 |
| dbo | inventoryissuesresults73 |
| dbo | inventoryissuesresults74 |
| dbo | inventoryissuesresults75 |
| dbo | InventoryIssuesResults76 |
| dbo | InventoryIssuesResults77 |
| dbo | InventoryIssuesResults78 |
| dbo | InventoryIssuesResults79 |
| dbo | InventoryIssuesResults8 |
| dbo | InventoryIssuesResults80 |
| dbo | InventoryIssuesResults81 |
| dbo | inventoryissuesresults82 |
| dbo | inventoryissuesresults83 |
| dbo | inventoryissuesresults84 |
| dbo | inventoryissuesresults85 |
| dbo | inventoryissuesresults86 |
| dbo | InventoryIssuesResults9 |
| dbo | InventoryIssuesRun |
| dbo | InventoryIssuesRunItemLocation |
| dbo | inventoryissuestest_x_rebuild |
| dbo | InventoryIssuesTestDesc |
| dbo | InventoryIssuesTestRunDetail |
| dbo | InventoryIssuesTests |
| dbo | item_attribute_value |
| dbo | item_catalog |
| dbo | item_catalog_def |
| dbo | item_catalog_def_detail |
| dbo | item_category |
| dbo | item_category_image |
| dbo | item_category_link |
| dbo | item_category_text |
| dbo | item_category_x_class |
| dbo | item_category_x_inv_mast |
| dbo | item_classification |
| dbo | item_commission_class |
| dbo | item_commitment_detail |
| dbo | item_commitment_hdr |
| dbo | item_commitment_location |
| dbo | item_commitment_ship_to |
| dbo | item_conversion |
| dbo | item_count_detail |
| dbo | item_count_detail_sbl |
| dbo | item_count_hdr |
| dbo | item_integration_item_status |
| dbo | item_labor |
| dbo | item_lead_time |
| dbo | item_list_dtl |
| dbo | item_list_hdr |
| dbo | item_merge_audit |
| dbo | item_merge_verification |
| dbo | item_notepad |
| dbo | item_package |
| dbo | item_package_type |
| dbo | item_prefix_194 |
| dbo | item_price_dts |
| dbo | item_price_dts_criteria |
| dbo | item_price_level_update_dtl |
| dbo | item_price_level_update_hdr |
| dbo | item_putaway_attribute |
| dbo | item_rebuild_inventory_value_delta |
| dbo | item_rebuild_inventory_value_hdr |
| dbo | item_reservation |
| dbo | item_revision |
| dbo | item_service |
| dbo | item_service_contract |
| dbo | item_uom |
| dbo | loan_item |
| dbo | loan_item_extra |
| dbo | loan_security_item |
| dbo | lot_rebuild_inventory_value_delta |
| dbo | medical_coupon_hdr_x_inv_mast |
| dbo | oe_hdr_product_group |
| dbo | oe_line_po_x_inv_receipts_line |
| dbo | opportunity_product_group |
| dbo | p21_future_stock_analysis_report |
| dbo | p21_future_stock_analysis_run |
| dbo | p21_inventory_issues_row |
| dbo | p21_price_engine_run_item |
| dbo | p21_rebuild_inv_tran_insert |
| dbo | pda_oelist_item |
| dbo | pinpoint_item_qty_sync |
| dbo | price_method_x_item |
| dbo | price_page_item |
| dbo | pricing_service_product_accts |
| dbo | pricing_template_item_dflt |
| dbo | problem_code_x_inv_mast |
| dbo | process_predefined_item |
| dbo | prod_ord_comp_x_inv_adj |
| dbo | product_group |
| dbo | product_group_direct_ship |
| dbo | product_group_effective_days |
| dbo | product_group_prc_ctrl_dtl |
| dbo | product_group_prefix |
| dbo | product_group_x_restricted_class |
| dbo | product_service_mx |
| dbo | restricted_item_criteria_dts |
| dbo | rf_found_item |
| dbo | rf_terminal_inventory |
| dbo | roles_loa_restricted_items |
| dbo | safety_stock_analysis_run |
| dbo | service_inv_mast |
| dbo | service_inv_mast_pm_item |
| dbo | service_inv_mast_pm_sched |
| dbo | service_item_notepad |
| dbo | ship_to_item |
| dbo | ship_to_x_inv_mast |
| dbo | special_inv_layer |
| dbo | special_inv_layer_tran |
| dbo | ssis_restricted_items_work |
| dbo | ssis_temp_restricted_item_quantity_limits |
| dbo | ssis_temp_restricted_items |
| dbo | supplier_item_conversion |
| dbo | swisslog_inventory_deviation |
| dbo | tag_inv_tran_detail |
| dbo | tag_inv_tran_hdr |
| dbo | tax_exception_list_x_inv_mast |
| dbo | temp_inv_mast_merge |
| dbo | temp_inv_mast_nsync |
| dbo | temp_inventory_rebuild_items |
| dbo | temp_inventory_rebuild_periods |
| dbo | temp_inventory_usage_rebuild |
| dbo | temp_item_uom |
| dbo | temp_rescale_inv_adj_line |
| dbo | temp_rescale_inv_bin_qty |
| dbo | temp_rescale_inv_loc_cost |
| dbo | temp_rescale_inv_loc_qty |
| dbo | temp_rescale_inv_mast_purchase_pricing_unit |
| dbo | temp_rescale_inv_mast_weight |
| dbo | temp_rescale_inv_period_usage |
| dbo | temp_rescale_inv_tran_bin_detail |
| dbo | temp_rescale_inv_tran_lot_detail |
| dbo | temp_rescale_inventory_receipts_line_pricing_unit_size |
| dbo | temp_rescale_inventory_receipts_line_unit_size |
| dbo | temp_rescale_inventory_return_line_price_unit_size |
| dbo | temp_rescale_inventory_return_line_qty |
| dbo | temp_rescale_inventory_supplier_cost |
| dbo | temp_rescale_inventory_supplier_list_price |
| dbo | temp_rescale_item_uom |
| dbo | temp_rescale_uom_inv_tran |
| dbo | temp_special_inv_layer_cost |
| dbo | temp_special_inv_layer_qty |
| dbo | tpcx_dead_stock |
| dbo | tropic_po_gen_item_note |
| dbo | weboe_item_category_data |
| dbo | weboe_item_category_group_data |
| dbo | weboe_item_data |
| dbo | weboe_item_location_data |
| dbo | weboe_item_pricebreaks_data |
| dbo | weboe_stock_outs_data |
| dbo | workbench_query_inventory |
| ssb | trig_inv_adj_hdr |
| ssb | trig_inv_adj_line |
| ssb | trig_inv_cost_edit |
| ssb | trig_inv_loc |

### Detailed Table Information

#### dbo.average_inventory_value

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| average_inventory_value_uid | int |  | NO |
| demand_period_uid | int |  | NO |
| location_id | decimal |  | NO |
| inv_mast_uid | int |  | NO |
| inventory_value | decimal |  | NO |
| no_of_updates | int |  | NO |
| date_created | datetime |  | NO |
| created_by | varchar | 255 | NO |
| date_last_modified | datetime |  | NO |
| last_maintained_by | varchar | 255 | NO |

#### dbo.b2b_temp_category_x_item

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| b2b_temp_category_x_item_uid | int |  | NO |
| item_category_uid | int |  | NO |
| sequence_no | int |  | NO |
| inv_mast_uid | int |  | NO |
| display_desc | varchar | 255 | NO |

#### dbo.b2b_temp_cust_item

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| b2b_temp_cust_item_uid | int |  | NO |
| item_code | varchar | 40 | NO |
| part_number | varchar | 40 | NO |
| customer_code | varchar | 10 | NO |
| delete_flag | char | 1 | NO |
| unit_name | varchar | 10 | YES |
| unit_size | decimal |  | YES |

#### dbo.b2b_temp_inventory_cross_reference

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| cross_reference_uid | int |  | NO |
| inv_mast_uid | int |  | NO |
| manufacturer | varchar | 255 | YES |
| model_number | varchar | 255 | YES |
| major_category | varchar | 255 | YES |
| minor_category | varchar | 255 | YES |

#### dbo.b2b_temp_item

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| frecno | int |  | NO |
| item_code | varchar | 40 | NO |
| item_desc1 | varchar | 4000 | YES |
| item_desc2 | varchar | 4000 | YES |
| item_desc3 | varchar | 4000 | YES |
| item_desc4 | varchar | 4000 | YES |
| short_code | varchar | 40 | YES |
| vend_number | varchar | 40 | YES |
| upc_code | varchar | 40 | YES |
| item_number | varchar | 40 | YES |
| catg_list | varchar | 30 | YES |
| item_desc5 | varchar | 4000 | YES |
| pkg_size | int |  | YES |
| cat_page | int |  | YES |
| list_price | decimal |  | NO |
| mfg_code | varchar | 50 | YES |
| searchable | varchar | 5 | YES |
| internal_item_code | varchar | 40 | YES |
| extended_desc | varchar | 500 | YES |
| weight | decimal |  | NO |
| item_type_cd | int |  | YES |
| keywords | text | 2147483647 | YES |
| sales_unit | varchar | 8 | YES |
| sales_unit_size | decimal |  | NO |
| delete_flag | char | 1 | NO |
| suggested_retail_price | decimal |  | NO |
| dimension | varchar | 30 | YES |
| track_serial_number | char | 1 | NO |
| restricted_flag | char | 1 | NO |
| country_of_origin | varchar | 50 | YES |
| has_substitutes_flag | char | 1 | NO |
| has_accessories_flag | char | 1 | NO |
| unspsc_code | varchar | 255 | YES |
| class4 | varchar | 255 | YES |
| class5 | varchar | 255 | YES |
| class3 | varchar | 255 | YES |
| class2 | varchar | 255 | YES |
| class1 | varchar | 255 | YES |
| class1_desc | varchar | 30 | YES |
| class2_desc | varchar | 30 | YES |
| class3_desc | varchar | 30 | YES |
| class4_desc | varchar | 30 | YES |
| class5_desc | varchar | 30 | YES |
| custom_vendor_code | varchar | 255 | YES |
| custom_vendor_name | varchar | 255 | YES |
| price_family_id | varchar | 255 | YES |
| item_length | decimal |  | YES |
| item_width | decimal |  | YES |
| item_height | decimal |  | YES |

*Note: Only showing details for the first 5 tables in this category. 393 more tables exist.*

## Key Metrics

### Table Summary

| Schema | Table Name |
|--------|------------|
| dbo | ads_audit_customer |
| dbo | ads_audit_invoice |
| dbo | ads_audit_order |
| dbo | ads_metric_configuration |
| dbo | apc_import_order_header |
| dbo | apc_import_order_line |
| dbo | apc_sales_location_x_zip_code |
| dbo | b2b_temp_corporation_customer |
| dbo | b2b_temp_customer |
| dbo | b2b_temp_customer_goal_detail |
| dbo | b2b_temp_customer_goal_hdr |
| dbo | b2b_temp_customer_x_dealer_type |
| dbo | b2b_temp_customer_x_rewards_program |
| dbo | b2b_temp_invoice_line_rewards |
| dbo | b2b_temp_order_surcharge |
| dbo | b2b_temp_salesrep |
| dbo | bin_replenishment_order |
| dbo | boeing_order_10000 |
| dbo | boeing_order_xref_10000 |
| dbo | buying_trend_customer_item_list |
| dbo | buying_trend_earliest_sales_bucket |
| dbo | buying_trend_invoice_line_bucket |
| dbo | carrier_contract_customer |
| dbo | centeron_order_import |
| dbo | commission_run_consolidated_invoice_holding |
| dbo | commission_run_invoice_line_amounts |
| dbo | company_lc_search_order |
| dbo | company_lost_sales |
| dbo | consolidated_invoices_xref |
| dbo | consolidated_invoices_xref_p21_case938985 |
| dbo | contact_salesrep |
| dbo | cpa_customer_watchlist |
| dbo | cpa_net_profit_configuration |
| dbo | cpa_np_customer_detail_working |
| dbo | cpa_scorecard_configuration_x_metric |
| dbo | cpa_scorecard_customer_detail_working |
| dbo | custom_column_data_customer |
| dbo | customer |
| dbo | customer_10011 |
| dbo | customer_194 |
| dbo | customer_2164 |
| dbo | customer_322 |
| dbo | customer_335 |
| dbo | customer_45 |
| dbo | customer_723 |
| dbo | customer_activity |
| dbo | customer_activity_link |
| dbo | customer_activity_type |
| dbo | customer_aha |
| dbo | customer_CAD_initiator_audit |
| dbo | customer_CAD_target_audit |
| dbo | customer_call |
| dbo | customer_call_inv_detail |
| dbo | customer_category |
| dbo | customer_class_order_charge |
| dbo | customer_class_x_inventory_class |
| dbo | customer_cons_inv_cardlock |
| dbo | customer_contract |
| dbo | customer_contract_class |
| dbo | customer_coop_advert_allowance |
| dbo | customer_core_tracking |
| dbo | customer_coupon |
| dbo | customer_credit_history |
| dbo | customer_credit_history_daily |
| dbo | customer_CUCO_initiator_audit |
| dbo | customer_CUCO_target_audit |
| dbo | customer_CUS_initiator_audit |
| dbo | customer_CUS_target_audit |
| dbo | customer_document |
| dbo | customer_dynamic_dataset |
| dbo | customer_dynamic_dataset_detail |
| dbo | customer_edi_setting |
| dbo | customer_edi_trans_detail |
| dbo | customer_edi_transaction |
| dbo | customer_email_defaults |
| dbo | customer_email_subject |
| dbo | customer_fedex |
| dbo | customer_form_template |
| dbo | customer_freight_charge |
| dbo | customer_freight_display |
| dbo | customer_freight_options |
| dbo | customer_gl_code |
| dbo | customer_goal_detail |
| dbo | customer_goal_hdr |
| dbo | customer_gpo |
| dbo | customer_help |
| dbo | customer_invoice_surcharge |
| dbo | customer_item_comm_class |
| dbo | customer_item_reserve |
| dbo | customer_iva_tax |
| dbo | customer_kit_markup |
| dbo | customer_language |
| dbo | customer_list_temp |
| dbo | customer_lot_requirement |
| dbo | customer_merge_audit |
| dbo | customer_merge_cust |
| dbo | customer_merge_verification |
| dbo | customer_notepad |
| dbo | customer_oe_info |
| dbo | customer_order_duplicate_check |
| dbo | customer_order_history |
| dbo | customer_order_history_daily |
| dbo | customer_order_surcharge |
| dbo | customer_package_hdr |
| dbo | customer_package_hdr_xfer |
| dbo | customer_package_line |
| dbo | customer_package_line_xfer |
| dbo | customer_profitability_role |
| dbo | customer_retail |
| dbo | customer_retail_item |
| dbo | customer_retail_pricing |
| dbo | customer_salesrep |
| dbo | customer_salesrep_location |
| dbo | customer_sensitivity_matrix |
| dbo | customer_single_discount |
| dbo | customer_state_taxable_setting |
| dbo | customer_statement_history |
| dbo | customer_strategic_item |
| dbo | customer_strategic_pricing |
| dbo | customer_supplier |
| dbo | customer_supplier_freight |
| dbo | customer_terms |
| dbo | customer_tpw |
| dbo | customer_tradenet |
| dbo | customer_type |
| dbo | customer_ud |
| dbo | customer_vat |
| dbo | customer_volume_discount |
| dbo | customer_weboe |
| dbo | customer_x_contract_class |
| dbo | customer_x_dealer_type |
| dbo | customer_x_inv_mast |
| dbo | customer_x_restricted_class |
| dbo | customer_x_rewards_program |
| dbo | customer_x_shipto_credit_history_daily |
| dbo | customer_x_vendor |
| dbo | ecc_customer_detail |
| dbo | ecc_p21_get_customer_address_xml |
| dbo | ecc_p21_get_customer_address_xml_work |
| dbo | ecc_p21_get_customer_xml |
| dbo | ecc_p21_get_customer_xml_work |
| dbo | ecc_p21_get_oe_contacts_customer_xml |
| dbo | ecc_p21_get_oe_contacts_customer_xml_work |
| dbo | ecc_transaction_order_by |
| dbo | eh_invoice_detail |
| dbo | email_notification_orders |
| dbo | event_order |
| dbo | fault_tolerance_production_orders |
| dbo | fault_tolerance_purchase_orders |
| dbo | fault_tolerance_sales_orders |
| dbo | icm_customer_item_info |
| dbo | inv_hdr_salesrep_rules |
| dbo | inv_line_salesrep_rules |
| dbo | inv_loc_salesrep |
| dbo | inv_rcpts_x_vendor_invoice |
| dbo | invlinesalesrep_rma_linked |
| dbo | invoice_batch |
| dbo | invoice_cfdi |
| dbo | invoice_cfdi_x_voucher |
| dbo | invoice_class |
| dbo | invoice_comprobante_rel |
| dbo | invoice_deletion_invoice_hdr |
| dbo | invoice_deletion_oe_hdr |
| dbo | invoice_floor_plan_xref |
| dbo | invoice_hdr |
| dbo | invoice_hdr_2164 |
| dbo | invoice_hdr_220 |
| dbo | invoice_hdr_asn |
| dbo | invoice_hdr_audit_trail |
| dbo | invoice_hdr_cardlock |
| dbo | invoice_hdr_cash_app |
| dbo | invoice_hdr_CUS_initiator_audit |
| dbo | invoice_hdr_CUS_target_audit |
| dbo | invoice_hdr_customer_po |
| dbo | invoice_hdr_edit |
| dbo | invoice_hdr_edit_audit_trail |
| dbo | invoice_hdr_freight_allowed |
| dbo | invoice_hdr_installment |
| dbo | invoice_hdr_not_delete |
| dbo | invoice_hdr_notepad |
| dbo | invoice_hdr_notepad_edit |
| dbo | invoice_hdr_prelim_tracking |
| dbo | invoice_hdr_salesrep |
| dbo | invoice_hdr_salesrep_audit_trail |
| dbo | invoice_hdr_salesrep_edit |
| dbo | invoice_hdr_salesrep_edit_audit_trail |
| dbo | invoice_hdr_signature |
| dbo | invoice_hdr_tax_juris_edit |
| dbo | invoice_hdr_tax_juris_edit_audit_trail |
| dbo | invoice_hdr_x_tax_juris_manual |
| dbo | invoice_hdr_x_tax_juris_manual_audit_trail |
| dbo | invoice_iva_tax |
| dbo | invoice_line |
| dbo | invoice_line_2164 |
| dbo | invoice_line_235 |
| dbo | invoice_line_audit_trail |
| dbo | invoice_line_eco_fee |
| dbo | invoice_line_edit |
| dbo | invoice_line_edit_audit_trail |
| dbo | invoice_line_notepad |
| dbo | invoice_line_price_protection |
| dbo | invoice_line_proration |
| dbo | invoice_line_rewards |
| dbo | invoice_line_rewards_buy_get |
| dbo | invoice_line_salesrep |
| dbo | invoice_line_servicebench_claim |
| dbo | invoice_line_taxes |
| dbo | invoice_line_taxes_audit_trail |
| dbo | invoice_line_taxes_cardlock |
| dbo | invoice_line_taxes_perunit |
| dbo | invoice_link_type_mx |
| dbo | invoice_types |
| dbo | invoice_x_work_order |
| dbo | invoiced_cfdi_certification |
| dbo | job_price_customer_shipto |
| dbo | john_deere_order_info_10008 |
| dbo | label_definition_x_customer |
| dbo | loan_customer |
| dbo | location_workorder_info |
| dbo | lost_sales |
| dbo | lost_sales_transaction |
| dbo | medical_coupon_customer_dtl |
| dbo | metrics |
| dbo | metrics_calculation_log |
| dbo | metrics_customer_detail_working |
| dbo | metrics_daily_customer |
| dbo | metrics_daily_customer_working |
| dbo | metrics_db_upgrade_history |
| dbo | metrics_filter_result |
| dbo | metrics_filter_sql |
| dbo | metrics_hierarchy_execution_level |
| dbo | metrics_hierarchy_level |
| dbo | metrics_period_customer |
| dbo | metrics_period_date_dimension |
| dbo | metrics_period_definition |
| dbo | metrics_period_execution |
| dbo | metrics_period_hierarchy |
| dbo | metrics_settings |
| dbo | metrics_x_data_source |
| dbo | metrics_x_indirect_cost |
| dbo | oe_contacts_customer |
| dbo | oe_contacts_customer_CUCO_initiator_audit |
| dbo | oe_contacts_customer_CUCO_target_audit |
| dbo | oe_hdr_order_cmp_pct |
| dbo | oe_hdr_salesrep |
| dbo | oe_hdr_work_order_info |
| dbo | oe_line_last_margin_price |
| dbo | oe_line_salesrep |
| dbo | oe_line_work_order |
| dbo | opportunity_x_order |
| dbo | order_based_commission |
| dbo | order_cost_category |
| dbo | order_floor_plan_xref_10002 |
| dbo | order_hold_class |
| dbo | order_import_exception |
| dbo | order_iva_tax |
| dbo | order_location_switch |
| dbo | order_priority |
| dbo | order_priority_threshold |
| dbo | order_surcharge |
| dbo | order_terms_acceptance |
| dbo | order_totals |
| dbo | order_type_value |
| dbo | order_types |
| dbo | p21_unallocate_orders_bin_info |
| dbo | p21_unallocate_orders_lot_bin_info |
| dbo | p21_unallocate_orders_lot_info |
| dbo | p21_unallocate_orders_order_line_info |
| dbo | p21_unallocate_orders_order_line_schedule_info |
| dbo | payment_account_x_customer |
| dbo | price_method_x_customer |
| dbo | prod_order_deletion_prod_ord_hdr |
| dbo | prod_order_hdr |
| dbo | prod_order_line |
| dbo | prod_order_line_comp_frght |
| dbo | prod_order_line_comp_labor |
| dbo | prod_order_line_component |
| dbo | prod_order_line_link |
| dbo | prod_order_line_process |
| dbo | prod_order_print_info |
| dbo | prod_order_system_parameters |
| dbo | prodorder_calendar |
| dbo | prodorder_labor |
| dbo | prodorder_labor_proc_dtl |
| dbo | prodorder_labor_proc_hdr |
| dbo | prodorder_labor_rate |
| dbo | prodorder_labor_schedule |
| dbo | prodorder_shift |
| dbo | prodorder_tech_x_labor |
| dbo | prodorder_technician |
| dbo | prodorder_work_center |
| dbo | prodorder_work_day |
| dbo | product_group_duplicate_order |
| dbo | product_group_salesrep |
| dbo | progress_billing_x_invoice_hdr |
| dbo | rebill_invoice_reason |
| dbo | repair_sales_orders |
| dbo | repair_sales_orders_history |
| dbo | ribbon_metric |
| dbo | ribbon_metric_x_roles |
| dbo | ribbon_metric_x_users |
| dbo | roles_loa_sales_disc_grp |
| dbo | sales_calls |
| dbo | sales_market_group |
| dbo | sales_mgmt_criteria |
| dbo | sales_pricing_option |
| dbo | salesrep_comm_days_overdue |
| dbo | salesrep_commission |
| dbo | salesrep_commission_class |
| dbo | salesrep_commission_split |
| dbo | salesrep_inside |
| dbo | salesrep_notepad |
| dbo | salesrep_postalcode |
| dbo | salesrep_quota |
| dbo | salesrep_quota_detail |
| dbo | salesrep_quota_period |
| dbo | salesrep_quota_x_quarter |
| dbo | salesrep_weboe |
| dbo | sat_invoice_auxfoliorep_mx |
| dbo | service_order_priority |
| dbo | ship_to_order_cmp_pct |
| dbo | ship_to_salesrep |
| dbo | ship_to_salesrep_location |
| dbo | sql_stm_fk_inv_hdr_sales_rep |
| dbo | strategic_pricing_invoice |
| dbo | summary_invoice_daily |
| dbo | summary_invoice_monthly |
| dbo | summary_sales_daily |
| dbo | summary_sales_monthly |
| dbo | temp_billtrust_statement_customer_list |
| dbo | temp_customer_merge |
| dbo | temp_invoice_cost |
| dbo | temp_invoice_hdr_cash_receipt |
| dbo | temp_invoice_summary |
| dbo | temp_order_change_order_header |
| dbo | temp_order_change_order_line |
| dbo | temp_rescale_inv_mast_sales_pricing_unit |
| dbo | temp_rescale_invoice_line_pricing_unit_size |
| dbo | temp_rescale_invoice_line_sales_unit_size |
| dbo | temp_rescale_invoice_line_unit_price |
| dbo | temp_rescale_prod_order_line |
| dbo | temp_rescale_prod_order_line_component |
| dbo | temp_sales_summary |
| dbo | temp_weboe_customer_info |
| dbo | terms_x_customer |
| dbo | territory_x_customer |
| dbo | tpw_sales_history_dtl |
| dbo | tpw_sales_history_hdr |
| dbo | transfer_backorders |
| dbo | transfer_backorders_detail |
| dbo | transfer_backorders_notepad |
| dbo | tropic_order_evaluation |
| dbo | users_x_salesrep |
| dbo | vendor_invoice_edi |
| dbo | vendor_invoice_hdr |
| dbo | vendor_invoice_hdr_import_results |
| dbo | vendor_invoice_line |
| dbo | weboe_customer_contact_data |
| dbo | weboe_customer_data |
| dbo | weboe_customer_statistics_data |
| dbo | weboe_invoice_history_data |
| dbo | weboe_items_on_backorder_data |
| dbo | weboe_new_order_header_data |
| dbo | weboe_new_order_line_data |
| dbo | weboe_order_header_change_data |
| dbo | weboe_order_line_change_data |
| dbo | weboe_orders_on_credit_hold_data |
| dbo | work_order |
| dbo | work_order_audit_trail |
| dbo | work_order_item |
| dbo | work_order_labor |
| dbo | work_order_notepad |
| dbo | work_order_report_run |
| dbo | work_order_schedule |
| dbo | work_order_type |
| dbo | work_order_type_x_skillset |
| dbo | work_order_type_x_udf |
| dbo | work_order_unit_room |
| dbo | work_order_x_labor_type |
| dbo | work_order_x_unit |
| dbo | work_order_x_unit_x_unit_udf |
| ssb | trig_invoice_hdr |
| ssb | trig_invoice_hdr_edit |
| ssb | trig_invoice_hdr_salesrep |
| ssb | trig_invoice_hdr_salesrep_edit |
| ssb | trig_invoice_hdr_tax_juris_edit |
| ssb | trig_invoice_hdr_x_tax_juris_manual |
| ssb | trig_invoice_line |
| ssb | trig_invoice_line_edit |
| ssb | trig_invoice_line_taxes |
| ssb | trig_oe_hdr_salesrep |

### Detailed Table Information

#### dbo.ads_audit_customer

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| ads_audit_customer_uid | int |  | NO |
| ads_audit_run_uid | int |  | NO |
| company_id | varchar | 8 | NO |
| customer_id | decimal |  | NO |
| customer_since_date | datetime |  | YES |
| date_last_order | datetime |  | YES |
| date_last_shipment | datetime |  | YES |
| freight_cd | varchar | 30 | YES |
| special_labeling_flag | char | 1 | YES |
| special_packaging_flag | char | 1 | YES |
| unique_items_ordered | int |  | YES |
| items_ordered_multiple_times | int |  | YES |
| quote_lines_won_count | int |  | YES |
| days_sales_outstanding | decimal |  | YES |
| average_days_to_pay | decimal |  | YES |
| credit_limit | decimal |  | YES |
| credit_limit_used | decimal |  | YES |
| average_days_past_due | decimal |  | YES |
| last_customer_contact_date | datetime |  | YES |
| pricing_method | varchar | 255 | YES |
| credit_status | varchar | 8 | YES |
| total_number_collection_calls | int |  | YES |
| date_created | datetime |  | NO |
| created_by | varchar | 255 | NO |

#### dbo.ads_audit_invoice

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| ads_audit_invoice_uid | int |  | NO |
| ads_audit_run_uid | int |  | NO |
| company_id | varchar | 8 | NO |
| customer_id | decimal |  | NO |
| metric_date | datetime |  | NO |
| invoice_no | varchar | 10 | NO |
| sales_amount | decimal |  | YES |
| cogs_amount | decimal |  | YES |
| invoiced_sample_value | decimal |  | YES |
| num_invoiced_sample_lines | int |  | YES |
| num_of_credit_rebill_invoices | int |  | YES |
| rebill_invoice_no | varchar | 10 | YES |
| credit_memo_invoice_no | varchar | 10 | YES |
| rebill_orig_invoice_diff_value | decimal |  | YES |
| number_of_shipments | int |  | YES |
| number_of_invoices | int |  | YES |
| date_created | datetime |  | NO |
| created_by | varchar | 255 | NO |

#### dbo.ads_audit_order

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| ads_audit_order_uid | int |  | NO |
| ads_audit_run_uid | int |  | NO |
| company_id | varchar | 8 | NO |
| customer_id | decimal |  | NO |
| metric_date | datetime |  | NO |
| order_no | varchar | 8 | NO |
| number_of_canceled_lines | int |  | YES |
| canceled_line_value | decimal |  | YES |
| number_of_rma_lines | int |  | YES |
| rma_line_value | decimal |  | YES |
| number_of_quote_lines | int |  | YES |
| quote_line_value | decimal |  | YES |
| num_of_converted_quote_lines | int |  | YES |
| converted_quote_line_value | decimal |  | YES |
| num_of_consign_rep_order_lines | int |  | YES |
| consign_rep_order_value | decimal |  | YES |
| num_of_consign_usage_order_lines | int |  | YES |
| consign_usage_order_value | decimal |  | YES |
| num_of_price_override_lines | int |  | YES |
| manual_price_override_value | decimal |  | YES |
| number_of_sales_lines | int |  | YES |
| number_of_front_counter_lines | int |  | YES |
| number_of_special_lines | int |  | YES |
| number_of_direct_ship_lines | int |  | YES |
| number_of_delivered_lines | int |  | YES |
| number_of_web_order_lines | int |  | YES |
| number_of_non_stock_lines | int |  | YES |
| number_of_bin_managed_lines | int |  | YES |
| number_of_obt_lines | int |  | YES |
| number_of_edi_order_lines | int |  | YES |
| number_of_orders | int |  | YES |
| order_total | decimal |  | YES |
| date_created | datetime |  | NO |
| created_by | varchar | 255 | NO |

#### dbo.ads_metric_configuration

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| ads_metric_configuration_uid | int |  | NO |
| hub_metric_key | varchar | 255 | NO |
| configuration_display_text | varchar | 255 | NO |
| date_created | datetime |  | NO |
| created_by | varchar | 255 | NO |
| date_last_modified | datetime |  | NO |
| last_maintained_by | varchar | 255 | NO |
| configuration_key | varchar | 255 | NO |

#### dbo.apc_import_order_header

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| uid | decimal |  | NO |
| import_set_no | varchar | 40 | YES |
| company_id | varchar | 8 | YES |
| customer_id | decimal |  | YES |
| ship_to_id | decimal |  | YES |
| order_date | datetime |  | YES |
| ship_to_name | varchar | 50 | YES |
| ship_to_address1 | varchar | 50 | YES |
| ship_to_address2 | varchar | 50 | YES |
| ship_to_city | varchar | 50 | YES |
| ship_to_state | varchar | 50 | YES |
| ship_to_zip | varchar | 10 | YES |
| ship_to_country | varchar | 50 | YES |
| ship_to_phone | varchar | 50 | YES |
| ship_to_email | varchar | 255 | YES |
| contact_id | decimal |  | YES |
| freight_code | varchar | 20 | YES |
| job_name | varchar | 40 | YES |
| contract_id | varchar | 40 | YES |
| requested_date | datetime |  | YES |
| customer_po_no | varchar | 20 | YES |
| sales_location_id | decimal |  | YES |
| ship_location_id | decimal |  | YES |
| delivery_instructions | varchar | 255 | YES |
| freight_out | decimal |  | YES |
| taker_id | varchar | 20 | YES |
| erp_order_no | varchar | 20 | YES |
| processing_started_flag | char | 1 | NO |
| processing_complete_flag | char | 1 | NO |
| date_created | datetime |  | YES |
| date_imported | datetime |  | YES |
| error_flag | char | 1 | NO |
| error_text | varchar | -1 | YES |
| payload | varchar | -1 | YES |
| response_payload | varchar | -1 | YES |

*Note: Only showing details for the first 5 tables in this category. 386 more tables exist.*

## POR Overview

### Table Summary

| Schema | Table Name |
|--------|------------|
| dbo | audit_trail_support |
| dbo | b2b_temp_corporation |
| dbo | balances_reporting_curr |
| dbo | bhl_release_bin |
| dbo | bin_movement_import_log |
| dbo | centeron_route_export |
| dbo | centeron_route_import |
| dbo | crystal_external_report |
| dbo | crystal_external_report_x_role |
| dbo | dim_acct_report_def |
| dbo | export_counter |
| dbo | export_matrix |
| dbo | fascor_export_data |
| dbo | fascor_export_log |
| dbo | fascor_import_data |
| dbo | fascor_import_ship_temp |
| dbo | fin_report |
| dbo | fin_report_stats_setup |
| dbo | financial_report_column |
| dbo | financial_report_row |
| dbo | financial_report_row_x_acct |
| dbo | frame_menu_reporting |
| dbo | gl_reporting_curr |
| dbo | gpor_dynamic_look_ahead |
| dbo | gpor_run |
| dbo | gpor_run_drp_forecasts |
| dbo | gpor_run_hdr |
| dbo | gpor_supplier_pending_log |
| dbo | gpor_vss |
| dbo | import_audit |
| dbo | import_audit_settings |
| dbo | import_suspense_fkerror |
| dbo | import_suspense_hdr |
| dbo | import_suspense_line |
| dbo | import_suspense_settings |
| dbo | import_temp_table_x_file |
| dbo | import_val_status |
| dbo | location_rental |
| dbo | lot_bin_dealloc_report |
| dbo | mft_x_import_transaction |
| dbo | module_x_portal |
| dbo | oe_line_rental_rate |
| dbo | oe_line_trackabout_lease |
| dbo | opportunity |
| dbo | opportunity_competitor |
| dbo | opportunity_contact |
| dbo | opportunity_list_temp |
| dbo | opportunity_stage |
| dbo | opportunity_status |
| dbo | opportunity_step |
| dbo | opportunity_supplier |
| dbo | opportunity_type |
| dbo | opportunity_x_room |
| dbo | pending_import |
| dbo | pick_ticket_report_criteria |
| dbo | port |
| dbo | port_printer |
| dbo | portal |
| dbo | portal_assignment |
| dbo | portal_element |
| dbo | portal_element_syntax |
| dbo | portal_user_defined |
| dbo | portal_x_portal_element |
| dbo | price_page_import_column |
| dbo | price_page_import_dtl |
| dbo | price_page_import_layout |
| dbo | published_portal |
| dbo | published_portal_detail |
| dbo | rental_class |
| dbo | rental_log |
| dbo | rental_processing |
| dbo | report |
| dbo | report_code |
| dbo | report_code_group_p21 |
| dbo | report_code_p21 |
| dbo | report_code_x_code_group_p21 |
| dbo | report_conditional |
| dbo | report_criteria |
| dbo | report_criteria_detail |
| dbo | report_email_defaults_x_token |
| dbo | report_email_subject_x_token |
| dbo | report_execution_configuration |
| dbo | report_execution_configuration_value |
| dbo | report_hdr |
| dbo | report_keyword |
| dbo | report_metadata |
| dbo | report_metadata_criteria |
| dbo | report_metadata_x_roles |
| dbo | report_metadata_x_users |
| dbo | report_presentation |
| dbo | report_style |
| dbo | report_territory |
| dbo | report_x_server_configuration |
| dbo | reporting_export_log |
| dbo | roles_portal |
| dbo | scheduled_import_def |
| dbo | scheduled_import_details |
| dbo | scheduled_import_master |
| dbo | scheduled_import_master_aux |
| dbo | servicebench_wrrnty_claim_pending_import |
| dbo | shipserv_tradenet_export |
| dbo | support_sql |
| dbo | support_sql_column_detail |
| dbo | temp_distranet_export |
| dbo | temp_portal_assignment |
| dbo | temp_portal_assignment_browser |
| dbo | trackabout_rental_cylinder |
| dbo | trackabout_rental_equipment |
| dbo | trackabout_rental_hdr |
| dbo | trackabout_rental_lease_renewal |
| dbo | trackabout_rental_line_balance |
| dbo | trackabout_rental_line_rental_class |
| dbo | transport_shipping_info |
| dbo | transportation_method |
| dbo | users_portal |

### Detailed Table Information

#### dbo.audit_trail_support

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| audit_trail_support_uid | int |  | NO |
| source_area_cd | int |  | NO |
| source_table_name | varchar | 255 | NO |
| company_column_name | varchar | 255 | YES |
| location_column_name | varchar | 255 | YES |
| completed_column_name | varchar | 255 | YES |
| line_no_display_flag | char | 1 | NO |
| inv_mast_uid_display_flag | char | 1 | NO |
| date_created | datetime |  | YES |
| created_by | varchar | 255 | NO |
| date_last_modified | datetime |  | NO |
| last_maintained_by | varchar | 255 | NO |

#### dbo.b2b_temp_corporation

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| b2b_temp_corporation_uid | int |  | NO |
| company_id | varchar | 8 | NO |
| corporate_id | varchar | 20 | NO |
| corporate_name | varchar | 255 | YES |

#### dbo.balances_reporting_curr

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| balances_reporting_curr_uid | int |  | NO |
| company_id | varchar | 8 | NO |
| account_no | varchar | 32 | NO |
| period | int |  | NO |
| year_for_period | int |  | NO |
| period_balance | decimal |  | NO |
| cumulative_balance | decimal |  | NO |
| date_created | datetime |  | NO |
| created_by | varchar | 255 | NO |
| date_last_modified | datetime |  | NO |
| last_maintained_by | varchar | 255 | NO |

#### dbo.bhl_release_bin

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| bhl_release_bin_uid | int |  | NO |
| bill_hold_line_uid | int |  | NO |
| serial_number | varchar | 40 | YES |
| bin_cd | varchar | 10 | NO |
| qty_to_confirm | decimal |  | NO |
| date_created | datetime |  | NO |
| created_by | varchar | 255 | NO |
| date_last_modified | datetime |  | NO |
| last_maintained_by | varchar | 255 | NO |
| row_status_flag | int |  | NO |

#### dbo.bin_movement_import_log

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| bin_movement_import_log_uid | int |  | NO |
| location_id | decimal |  | YES |
| inv_mast_uid | int |  | YES |
| from_bin_cd | varchar | 10 | YES |
| to_bin_cd | varchar | 10 | YES |
| qty_requested | decimal |  | YES |
| qty_in_bin | decimal |  | YES |
| date_created | datetime |  | NO |
| created_by | varchar | 255 | NO |
| date_last_modified | datetime |  | NO |
| last_maintained_by | varchar | 255 | NO |

*Note: Only showing details for the first 5 tables in this category. 110 more tables exist.*

## Web Orders

### Table Summary

| Schema | Table Name |
|--------|------------|
| dbo | ADPIM_Web |
| dbo | ADPIM_Webimage |
| dbo | b2b_web_reference_info |
| dbo | job_site |
| dbo | job_site_notepad |
| dbo | temp_jobsite_shipto_update |
| dbo | temp_Webimage |
| dbo | Temp_WEBPROD |
| dbo | Temp_WEBTABLE |
| dbo | web_display_type |
| dbo | weboe_audit_trail_detail |
| dbo | weboe_audit_trail_hdr |
| dbo | weboe_bcbi_data |
| dbo | weboe_code |
| dbo | weboe_cost_changes_data |
| dbo | weboe_file |
| dbo | weboe_ship_to_data |
| dbo | weboe_ship_to_unique |

### Detailed Table Information

#### dbo.ADPIM_Web

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| ADPIMID | int |  | NO |
| ProductID | varchar | 255 | YES |
| ITEMID | varchar | 255 | YES |
| Attrtxt01 | varchar | 255 | YES |
| Attrtxt02 | varchar | 255 | YES |
| Attrtxt03 | varchar | 255 | YES |
| Attrtxt04 | varchar | 255 | YES |
| Attrtxt05 | varchar | 255 | YES |
| Attrtxt06 | varchar | 255 | YES |
| Attrtxt07 | varchar | 255 | YES |
| Attrtxt08 | varchar | 255 | YES |
| MfgNumber | varchar | 255 | YES |
| ShipWt | varchar | 255 | YES |
| UPC | varchar | 255 | YES |
| Description | varchar | 255 | YES |

#### dbo.ADPIM_Webimage

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| ADPIMID | int |  | NO |
| ProductID | varchar | 255 | YES |
| ImageID | varchar | 255 | YES |
| Height | float |  | YES |
| Width | float |  | YES |
| ThHeight | float |  | YES |
| ThImageID | varchar | 255 | YES |
| ThWidth | float |  | YES |

#### dbo.b2b_web_reference_info

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| b2b_web_reference_info_uid | int |  | NO |
| web_shopper_id | int |  | NO |
| web_shopper_email | varchar | 50 | NO |
| web_reference_no | int |  | NO |

#### dbo.job_site

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| job_site_uid | int |  | NO |
| job_site_id | decimal |  | NO |
| job_site_desc | varchar | 255 | YES |
| company_id | varchar | 8 | NO |
| address_id | decimal |  | NO |
| county | varchar | 25 | YES |
| job_contact_id | varchar | 16 | YES |
| inspection_contact_id | varchar | 16 | YES |
| site_directions | text | 2147483647 | YES |
| project_uid | int |  | YES |
| region_uid | int |  | YES |
| job_site_partner_id | decimal |  | YES |
| location_desc | varchar | 255 | YES |
| location_type | varchar | 255 | YES |
| phase | varchar | 255 | YES |
| row_status_flag | smallint |  | NO |
| date_created | datetime |  | NO |
| date_last_modified | datetime |  | NO |
| last_maintained_by | varchar | 30 | NO |
| homeowner_selection_flag | char | 1 | NO |

#### dbo.job_site_notepad

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| job_site_note_uid | int |  | NO |
| note_id | decimal |  | NO |
| job_site_uid | int |  | NO |
| notepad_class_id | varchar | 8 | YES |
| topic | varchar | 255 | NO |
| note | text | 2147483647 | YES |
| activation_date | datetime |  | NO |
| expiration_date | datetime |  | NO |
| entry_date | datetime |  | NO |
| mandatory | char | 1 | NO |
| delete_flag | char | 1 | NO |
| date_created | datetime |  | NO |
| created_by | varchar | 255 | NO |
| date_last_modified | datetime |  | NO |
| last_maintained_by | varchar | 255 | NO |

*Note: Only showing details for the first 5 tables in this category. 13 more tables exist.*

## Other

### Table Summary

| Schema | Table Name |
|--------|------------|
| dbo | __RefactorLog |
| dbo | _TEMP_sku2 |
| dbo | accnt_group_mx |
| dbo | accnt_group_mx2 |
| dbo | accnts_x_accnt_group |
| dbo | ach_override |
| dbo | ach_transmission_file |
| dbo | activant_layout_def |
| dbo | activity |
| dbo | activity_reminder |
| dbo | activity_trans |
| dbo | ad_role_x_users |
| dbo | address |
| dbo | address_CAD_initiator_audit |
| dbo | address_CUCO_initiator_audit |
| dbo | address_CUS_initiator_audit |
| dbo | address_dea |
| dbo | address_freight_display |
| dbo | address_x_dea_license |
| dbo | address_x_restricted_class |
| dbo | adjustment_criteria |
| dbo | ADPIM_Prod |
| dbo | ads_audit_commission |
| dbo | ads_audit_run |
| dbo | agile_connect_systems |
| dbo | aha_security |
| dbo | aia_element |
| dbo | aiag_label |
| dbo | alert_implementation |
| dbo | Alert_implementation_query |
| dbo | alert_message |
| dbo | alert_queued_mail |
| dbo | alert_recipient |
| dbo | alert_recipient_role |
| dbo | alert_task |
| dbo | alert_task_aux_assignee |
| dbo | alert_type |
| dbo | alert_type_x_token |
| dbo | alternate_code |
| dbo | alternate_code_aux_info |
| dbo | alternate_oe_settings |
| dbo | anticipated_allocation |
| dbo | asb_call_criteria |
| dbo | asb_delivery_method |
| dbo | assembly_class |
| dbo | assembly_hdr |
| dbo | assembly_hdr_location |
| dbo | assembly_hdr_make_days |
| dbo | assembly_hdr_STK_initiator_audit |
| dbo | assembly_hdr_ud |
| dbo | assembly_line |
| dbo | assembly_line_STK_initiator_audit |
| dbo | assembly_line_tally |
| dbo | assignment |
| dbo | attribute |
| dbo | attribute_group |
| dbo | attribute_value |
| dbo | attribute_x_attribute_group |
| dbo | audit_trail |
| dbo | auto_test_detail |
| dbo | auto_test_hdr |
| dbo | auto_test_log_message |
| dbo | auto_test_run |
| dbo | auto_test_type |
| dbo | b2b_custom_table_statements |
| dbo | b2b_temp_assembly_detail |
| dbo | b2b_temp_assembly_header |
| dbo | b2b_temp_category_image |
| dbo | b2b_temp_category_link |
| dbo | b2b_temp_class |
| dbo | b2b_temp_contact |
| dbo | b2b_temp_contract_detail |
| dbo | b2b_temp_contract_hdr |
| dbo | b2b_temp_country |
| dbo | b2b_temp_dealer |
| dbo | b2b_temp_dealer_type |
| dbo | b2b_temp_delivery_stop |
| dbo | b2b_temp_district |
| dbo | b2b_temp_freight_code |
| dbo | b2b_temp_location |
| dbo | b2b_temp_monthly_category_sale |
| dbo | b2b_temp_quote_list_detail |
| dbo | b2b_temp_quote_list_header |
| dbo | b2b_temp_reason |
| dbo | b2b_temp_sale_statistics |
| dbo | b2b_temp_ship_to |
| dbo | b2b_temp_shipping_method |
| dbo | b2b_temp_shipping_method_x_freight_code |
| dbo | b2b_temp_state |
| dbo | b2b_temp_system_setting |
| dbo | b2b_temp_vendor |
| dbo | b2b_temp_vendor_category |
| dbo | b2b_temp_vendor_link |
| dbo | b3_customs_info |
| dbo | balances |
| dbo | bill_hold_hdr |
| dbo | bill_hold_line |
| dbo | bill_hold_line_x_adjust |
| dbo | bill_of_lading_detail |
| dbo | bill_of_lading_hdr |
| dbo | bill_to_category |
| dbo | bin |
| dbo | bin_picking_problem_info |
| dbo | bin_replenishment |
| dbo | bin_type |
| dbo | bin_ud |
| dbo | bin_zone |
| dbo | bin_zone_group |
| dbo | bin_zone_ud |
| dbo | bin_zone_x_bin_zone_group |
| dbo | block_pt_scan |
| dbo | boeing_caller_10000 |
| dbo | boeing_po_10000 |
| dbo | boeing_shipping_10000 |
| dbo | box |
| dbo | branch |
| dbo | builders_selection_sheet |
| dbo | business_object_key_fields |
| dbo | business_rule |
| dbo | business_rule_data_element |
| dbo | business_rule_event |
| dbo | business_rule_event_class |
| dbo | business_rule_event_extd_info |
| dbo | business_rule_event_key |
| dbo | business_rule_log |
| dbo | business_rule_rmb |
| dbo | business_rule_x_roles |
| dbo | business_rule_x_users |
| dbo | buy_get_locs |
| dbo | buy_get_supplier_redemption_info |
| dbo | buy_list_hdr |
| dbo | buy_list_line |
| dbo | buy_list_line_backup |
| dbo | call_category |
| dbo | call_log |
| dbo | canadian_customs_form |
| dbo | cancel_pick_ticket_bin |
| dbo | cancel_pick_ticket_lot |
| dbo | cancel_pick_ticket_serial |
| dbo | cancel_pick_ticket_tag |
| dbo | cash_drawer |
| dbo | cash_drawer_default_user |
| dbo | cash_drawer_transaction |
| dbo | cash_transfer |
| dbo | cash_transfer_audit_trail |
| dbo | category |
| dbo | category_x_activity |
| dbo | cc_columns |
| dbo | cc_processor_x_location |
| dbo | cc_processor_x_tripos_instance |
| dbo | cc_tables |
| dbo | cell_definition |
| dbo | cell_range |
| dbo | centeron_tank_monitor |
| dbo | certification_level |
| dbo | cfdi_type_mx |
| dbo | cfdi_usage_mx |
| dbo | class |
| dbo | class_expansion |
| dbo | class_expansion_view |
| dbo | class_expansion_view_error |
| dbo | class_name_x_form_code |
| dbo | class_STK_initiator_audit |
| dbo | clippership_return_10004 |
| dbo | clippership_return_nfa_1934 |
| dbo | code_group_p21 |
| dbo | code_p21 |
| dbo | code_x_code_group_p21 |
| dbo | code_x_code_p21 |
| dbo | columns |
| dbo | comm_run_line_rma_linked |
| dbo | commission_defaults |
| dbo | commission_rule |
| dbo | commission_rule_detail |
| dbo | commission_run |
| dbo | commission_run_exception |
| dbo | commission_run_line |
| dbo | commission_run_line_rule |
| dbo | commission_run_rule |
| dbo | commission_schedule |
| dbo | commission_schedule_detail |
| dbo | commodity_code |
| dbo | company |
| dbo | company_111 |
| dbo | company_322 |
| dbo | company_agent |
| dbo | company_attachments |
| dbo | company_cfdi_configuration |
| dbo | company_cust_size_limits |
| dbo | company_daily_deposit_counter |
| dbo | company_distranet_info |
| dbo | company_edi_setting |
| dbo | company_eft_options |
| dbo | company_ext_tax_gl_by_state |
| dbo | company_ext_tax_nexus_state |
| dbo | company_form_template |
| dbo | company_greeting_10016 |
| dbo | company_iva_tax |
| dbo | company_language |
| dbo | company_mac_adjustment |
| dbo | company_price_rounding_rules |
| dbo | company_so_options |
| dbo | company_strategic_pricing |
| dbo | company_tax_registration |
| dbo | company_trade |
| dbo | company_uk_mtd_setting |
| dbo | company_wit |
| dbo | company_work_day |
| dbo | company_x_dimension |
| dbo | company_x_oe_loc |
| dbo | competitor |
| dbo | competitor_representative |
| dbo | condition |
| dbo | connector_event |
| dbo | consignment_billing_cycle |
| dbo | consignment_bin_count |
| dbo | consolidated_asn_pick_ticket |
| dbo | consolidated_picking_hdr |
| dbo | consolidated_picking_line |
| dbo | contact_document |
| dbo | contact_filter_tracking |
| dbo | contact_insurance |
| dbo | contact_lead_source |
| dbo | contact_role |
| dbo | contact_type |
| dbo | contact_x_oe_hdr |
| dbo | contactlist |
| dbo | contacts |
| dbo | contacts_335 |
| dbo | contacts_CUCO_initiator_audit |
| dbo | contacts_outlook_sync_criteria |
| dbo | contacts_x_ship_to |
| dbo | contacts_x_ship_to_CUCO_initiator_audit |
| dbo | contacts_x_supplier |
| dbo | container_building |
| dbo | container_building_po |
| dbo | container_receipts_freight_po |
| dbo | container_receipts_hdr |
| dbo | container_receipts_line |
| dbo | container_type |
| dbo | contract_review |
| dbo | contract_x_contract_class |
| dbo | copy_table_data_x_clause |
| dbo | copy_table_data_x_column |
| dbo | copy_table_data_x_column_val |
| dbo | copy_table_data_x_counter |
| dbo | copy_table_data_x_process |
| dbo | copy_table_data_x_table |
| dbo | core_class |
| dbo | core_status_family_detail |
| dbo | core_status_family_hdr |
| dbo | corp_id |
| dbo | counter |
| dbo | country |
| dbo | country_mx |
| dbo | county |
| dbo | cpa_grade_notes |
| dbo | cpa_indirect_cost |
| dbo | cpa_np_dc_totals_working |
| dbo | cpa_np_ic_allocations_working |
| dbo | cpa_np_ic_gltotals_working |
| dbo | cpa_np_ic_totals_working |
| dbo | credit_memo_code |
| dbo | credit_status |
| dbo | credit_status_2164 |
| dbo | crew |
| dbo | crm_contact_information |
| dbo | crm_run |
| dbo | csout |
| dbo | cube_factor |
| dbo | cube_modifier |
| dbo | currency_contract |
| dbo | currency_hdr |
| dbo | currency_line |
| dbo | currency_sat_iso |
| dbo | currency_x_sat_code |
| dbo | cust_defaults |
| dbo | cust_defaults_email_defaults |
| dbo | cust_defaults_foreign |
| dbo | cust_defaults_labels |
| dbo | cust_defaults_merge_cust |
| dbo | cust_defaults_strategic |
| dbo | cust_defaults_terms_acct |
| dbo | custom_column_data_shipto |
| dbo | custom_column_data_supplier |
| dbo | custom_column_data_vendor |
| dbo | custom_column_definition |
| dbo | custom_column_list |
| dbo | custom_objects |
| dbo | custom_objects_backup |
| dbo | custom_objects_detail |
| dbo | customs_duty_rate |
| dbo | customs_mx |
| dbo | customs_patent_mx |
| dbo | cycle_count_accuracy |
| dbo | cycle_count_detail |
| dbo | cycle_count_hdr |
| dbo | cycle_count_loc_criteria |
| dbo | cycle_count_purchase_class |
| dbo | data_ident_x_data_ident_group |
| dbo | data_identifier |
| dbo | data_identifier_group |
| dbo | datasource |
| dbo | datasource_detail |
| dbo | datasource_x_roles |
| dbo | datasource_x_users |
| dbo | datastream |
| dbo | db_driven_maint |
| dbo | db_driven_maint_key |
| dbo | db_sql |
| dbo | dbmail_information |
| dbo | dc_migration_working |
| dbo | dc_nav_drill |
| dbo | dc_nav_drill_source_user |
| dbo | dc_nav_drill_x_roles |
| dbo | dc_nav_drill_x_users |
| dbo | dc_nav_source_request |
| dbo | dc_security |
| dbo | dc_security_detail |
| dbo | dc_security_x_roles |
| dbo | dc_security_x_users |
| dbo | dct_layout_column |
| dbo | dct_layout_file |
| dbo | dct_layout_hdr |
| dbo | dct_layout_rule |
| dbo | dct_lookup_detail |
| dbo | dct_lookup_hdr |
| dbo | dct_transaction |
| dbo | dct_transaction_config |
| dbo | dct_transaction_table |
| dbo | dct_transaction_table_config |
| dbo | dct_transaction_table_rule |
| dbo | dea_license |
| dbo | dealer_commission |
| dbo | dealer_commission_receipts |
| dbo | dealer_type |
| dbo | deallocate_transactions_run |
| dbo | decoder_comb_segment_dtl |
| dbo | decoder_comb_segment_hdr |
| dbo | decoder_segment_dtl |
| dbo | decoder_segment_dtl_breaks |
| dbo | decoder_segment_hdr |
| dbo | decoder_segment_hdr_rules |
| dbo | decoder_template_assm_opts |
| dbo | decoder_template_dtl |
| dbo | decoder_template_dtl_rules |
| dbo | decoder_template_dtl_val_rules |
| dbo | decoder_template_hdr |
| dbo | decoder_template_hdr_dflt |
| dbo | decoder_template_hdr_mask |
| dbo | degree_days |
| dbo | degree_days_delivery |
| dbo | delivery |
| dbo | delivery_group |
| dbo | delivery_package |
| dbo | delivery_pick_ticket |
| dbo | delivery_pick_ticket_detail |
| dbo | delivery_rma |
| dbo | delivery_rma_detail |
| dbo | delivery_ticket_info |
| dbo | delivery_x_delivery_group |
| dbo | delivery_zone |
| dbo | demand_forecast_formula |
| dbo | demand_level |
| dbo | demand_line_point |
| dbo | demand_pattern_criteria |
| dbo | demand_pattern_run |
| dbo | demand_pattern_run_seasonal |
| dbo | demand_period |
| dbo | demand_review_adjustment |
| dbo | design |
| dbo | dimensions |
| dbo | discount_group |
| dbo | discount_group_defaults |
| dbo | discount_group_x_restricted_class |
| dbo | discount_installment_10005 |
| dbo | dispatch_user_setting |
| dbo | dispatcher_pricing_dtl |
| dbo | dispatcher_pricing_hdr |
| dbo | disputed_voucher_reason |
| dbo | distranet_info |
| dbo | division |
| dbo | document |
| dbo | document_inout_data |
| dbo | document_line_bin |
| dbo | document_line_lot |
| dbo | document_line_lot_bin_xref |
| dbo | document_line_lot_grid |
| dbo | document_line_lot_sub |
| dbo | document_line_serial |
| dbo | document_link |
| dbo | document_link_entity_req |
| dbo | document_link_key |
| dbo | document_link_trans_type |
| dbo | document_link_window |
| dbo | document_link_window_x_key |
| dbo | document_printer_x_loc |
| dbo | document_transaction_data |
| dbo | document_types |
| dbo | door_bin_x_shipping_route |
| dbo | drill_security |
| dbo | drill_security_additional_menus |
| dbo | dtproperties |
| dbo | duty_drawback_hdr |
| dbo | duty_drawback_line |
| dbo | dw_autopop_cache |
| dbo | dw_syntax_cache |
| dbo | dw_syntax_cache_window |
| dbo | dwobject |
| dbo | dwobject_dependency |
| dbo | dwobject_syntax |
| dbo | dynachange |
| dbo | dynachange_config |
| dbo | dynachange_menu |
| dbo | ecc_alternate_code_delete |
| dbo | ecc_attribute_x_custom_column |
| dbo | ecc_column_lookup |
| dbo | ecc_custom_column_transfer_type_x_table |
| dbo | ecc_document_xref |
| dbo | ecc_get_table_schema_table |
| dbo | ecc_instance |
| dbo | ecc_p21_get_locations_xml |
| dbo | ecc_p21_get_locations_xml_work |
| dbo | ecc_p21_get_shopping_list_xml |
| dbo | ecc_p21_get_shopping_list_xml_work |
| dbo | ecc_run_date |
| dbo | ecc_sb_ALT |
| dbo | ecc_sb_audit |
| dbo | ecc_sb_CAD |
| dbo | ecc_sb_CUCO |
| dbo | ecc_sb_CUS |
| dbo | ecc_sb_STK |
| dbo | ecc_sb_STT |
| dbo | ecc_short_code_delete |
| dbo | ecc_sync_info |
| dbo | eco_fee_code |
| dbo | edi_852_log |
| dbo | edi_852_reserved_po_info |
| dbo | edi_process_info |
| dbo | email_log |
| dbo | email_notification |
| dbo | email_notification_message |
| dbo | email_notification_recipient |
| dbo | email_notification_token |
| dbo | email_signature_dflt_user_x_cust |
| dbo | epf_config_settings |
| dbo | epf_log |
| dbo | epf_plugin |
| dbo | epf_plugin_log |
| dbo | epf_transaction_detail |
| dbo | equip_engine_type |
| dbo | equip_manufacturer |
| dbo | equip_model |
| dbo | esc_base_view_alias |
| dbo | eva_skill_security |
| dbo | eva_skill_security_x_roles |
| dbo | eva_skill_security_x_users |
| dbo | ewing_coupon |
| dbo | ewing_job_line |
| dbo | ext_crm_setting |
| dbo | extensibility_dropdown_value |
| dbo | extensibility_object |
| dbo | extensibility_window |
| dbo | external_count_hdr |
| dbo | external_count_line |
| dbo | external_object |
| dbo | external_tax_backup_trans |
| dbo | external_tax_detail |
| dbo | external_tax_hdr |
| dbo | external_tax_line |
| dbo | factor_type_mx |
| dbo | fast_edit_change |
| dbo | fast_edit_detail |
| dbo | fast_edit_error |
| dbo | fast_edit_hdr |
| dbo | fast_edit_template |
| dbo | fast_edit_template_class |
| dbo | fast_edit_template_column |
| dbo | fast_edit_template_detail |
| dbo | fast_edit_template_query |
| dbo | fastedit_results |
| dbo | fastedit_results_columns |
| dbo | fastedit_results_dataelements |
| dbo | fastedit_roles |
| dbo | fault_tolerance_audit_trail |
| dbo | fault_tolerance_problem_code |
| dbo | fault_tolerance_transfers |
| dbo | fax_cover |
| dbo | fbff_criteria |
| dbo | fbff_forecasts |
| dbo | fbff_to_update |
| dbo | fc_dataobject |
| dbo | fc_dataobject_column |
| dbo | fc_dataobject_table |
| dbo | fc_table_join |
| dbo | fedex_return_tag |
| dbo | fedex_return_tag_detail |
| dbo | fedex_service_type |
| dbo | fedex_shipment_info |
| dbo | feedback_data_audit_trail |
| dbo | fidelitone_trans_log |
| dbo | field_chooser_info |
| dbo | fifo_layer_transaction |
| dbo | fifo_layers |
| dbo | fifo_layers_STK_initiator_audit |
| dbo | final_dc_dupes |
| dbo | floor_plan_10002 |
| dbo | for_alternate_code |
| dbo | for_note |
| dbo | for_unit_of_measure |
| dbo | form |
| dbo | form_destination |
| dbo | forms_output_log |
| dbo | frame_menu |
| dbo | freight_code |
| dbo | freight_code_2186 |
| dbo | freight_code_220 |
| dbo | freight_group_dtl |
| dbo | freight_group_hdr |
| dbo | freight_handling_break |
| dbo | freightquote_class |
| dbo | freightquote_package_detail |
| dbo | freightquote_package_hdr |
| dbo | freightquote_pkg_type |
| dbo | frl_seg_ctrl |
| dbo | frl_seg_desc |
| dbo | fuel_pricing |
| dbo | gas_formula_dtl |
| dbo | gas_formula_hdr |
| dbo | gensco_pricing_request |
| dbo | geocom_handheld |
| dbo | gl |
| dbo | gl_alloc |
| dbo | gl_audit_trail |
| dbo | gl_code |
| dbo | gl_code_list_detail |
| dbo | gl_code_list_hdr |
| dbo | gl_dimen_type |
| dbo | gl_dimen_type_x_value |
| dbo | gl_notepad |
| dbo | gl_trans_x_dimension |
| dbo | gl_trans_x_dimension_audit_trail |
| dbo | group_pick_ticket_detail |
| dbo | group_pick_ticket_hdr |
| dbo | group_po_hdr |
| dbo | group_po_line |
| dbo | gtor_run |
| dbo | hazmat_class |
| dbo | hazmat_code |
| dbo | help_access |
| dbo | help_topic |
| dbo | ideal_locations_by_zip |
| dbo | impexp_source |
| dbo | installment_dates_10005 |
| dbo | installment_frequency_10005 |
| dbo | installment_plan_discount_pct |
| dbo | installment_plans_10005 |
| dbo | intercompany_acct |
| dbo | intrastat_currency |
| dbo | intrastat_info |
| dbo | iqs_integration_lot_info |
| dbo | iqs_integration_receipt_info |
| dbo | IRS_1099_type |
| dbo | iso_currency_code |
| dbo | issues_reason |
| dbo | jc_job |
| dbo | job_based_commission |
| dbo | job_control_hdr |
| dbo | job_control_hdr_notepad |
| dbo | job_control_line |
| dbo | job_price_batch_hdr |
| dbo | job_price_batch_line |
| dbo | job_price_batch_line_x_employee |
| dbo | job_price_bin |
| dbo | job_price_bin_wurth |
| dbo | job_price_cust_shipto_aggr |
| dbo | job_price_cust_shipto_budget |
| dbo | job_price_cust_shipto_csn |
| dbo | job_price_cust_shipto_ordlim |
| dbo | job_price_hdr |
| dbo | job_price_hdr_148 |
| dbo | job_price_hdr_budget_prd |
| dbo | job_price_hdr_notepad |
| dbo | job_price_line |
| dbo | job_price_line_148 |
| dbo | job_price_line_budget_code |
| dbo | job_price_line_consign |
| dbo | job_price_line_quote_info |
| dbo | job_price_ship_control_no |
| dbo | job_price_value |
| dbo | job_price_vendor |
| dbo | job_quote_line |
| dbo | journal |
| dbo | journal_type_mx |
| dbo | jurisdiction_acct |
| dbo | jurisdiction_tax_is_taxable |
| dbo | label_definition |
| dbo | label_definition_x_loc |
| dbo | label_definition_x_ship_to |
| dbo | labor |
| dbo | labor_type |
| dbo | labor_type_x_location |
| dbo | labor_x_crew |
| dbo | labor_x_region |
| dbo | labor_x_skillset |
| dbo | landed_cost_category |
| dbo | landed_cost_category_x_company |
| dbo | landed_cost_driver |
| dbo | landed_cost_driver_tax |
| dbo | landed_cost_driver_x_po_hdr |
| dbo | language |
| dbo | lc_driver_x_receipts_hdr |
| dbo | lc_driver_x_tran |
| dbo | lc_driver_x_tran_detail |
| dbo | lead_source |
| dbo | legacy_b3_customs_info |
| dbo | link_quantity |
| dbo | list_temp |
| dbo | loan |
| dbo | location |
| dbo | location_allocation_info |
| dbo | location_allocation_path |
| dbo | location_attribute_group |
| dbo | location_form_template |
| dbo | location_intercompany |
| dbo | location_iva_tax |
| dbo | location_jurisdiction |
| dbo | location_language |
| dbo | location_loa_role |
| dbo | location_mx |
| dbo | location_packing_options |
| dbo | location_pod_options |
| dbo | location_source_transfer |
| dbo | location_supplier |
| dbo | location_supplier_194 |
| dbo | location_supplier_aqnet |
| dbo | location_supplier_STK_initiator_audit |
| dbo | location_supplier_ud |
| dbo | location_swisslog |
| dbo | location_terms |
| dbo | location_trackabout |
| dbo | location_trade |
| dbo | location_ud |
| dbo | location_x_po_hdr |
| dbo | log_pinpoint_trn_incoming |
| dbo | log_pinpoint_trn_info |
| dbo | lot |
| dbo | lot_adjust_alert |
| dbo | lot_attr_x_lot_attr_grp |
| dbo | lot_attribute |
| dbo | lot_attribute_group |
| dbo | lot_attribute_group_tran |
| dbo | lot_attribute_value |
| dbo | lot_audit |
| dbo | lot_bin_xref |
| dbo | lot_bin_xref_audit |
| dbo | lot_shelf_life_audit_trail |
| dbo | lot_uom |
| dbo | lot_x_lot_attribute_value |
| dbo | ltl_detail |
| dbo | machine |
| dbo | mail_list |
| dbo | manual_pick_sequence |
| dbo | manufacturer_program_type |
| dbo | manufacturing_class |
| dbo | mass_update_definition |
| dbo | mass_update_definition_detail |
| dbo | massupdate_change |
| dbo | massupdate_job_details_result |
| dbo | massupdate_job_result |
| dbo | massupdate_job_transaction_result |
| dbo | master_bin_audit_trail |
| dbo | master_inquiry_tab_default |
| dbo | med_coup_cust_dtl_x_oe_hdr |
| dbo | medical_coupon_hdr |
| dbo | message_foreign |
| dbo | message_log |
| dbo | messages |
| dbo | minmax_selection_criteria |
| dbo | modification |
| dbo | module |
| dbo | move_cost_criteria |
| dbo | mro_line_schedule |
| dbo | mru_window |
| dbo | msp_deletion_process_x_transaction |
| dbo | multi_po_asn_hdr |
| dbo | multi_po_asn_line |
| dbo | multi_po_asn_line_serial |
| dbo | multiple_uom_receipt |
| dbo | municipality_mx |
| dbo | mymenu |
| dbo | navigation_index |
| dbo | needs_list_194 |
| dbo | nmfc_hdr |
| dbo | note |
| dbo | note_template_detail |
| dbo | note_template_hdr |
| dbo | note_x_company |
| dbo | notepad_class |
| dbo | nsp_smtp_mail_error_log |
| dbo | oe_deletion_oe_hdr |
| dbo | oe_hdr |
| dbo | oe_hdr_15 |
| dbo | oe_hdr_369 |
| dbo | oe_hdr_additional_info |
| dbo | oe_hdr_advance_billing |
| dbo | oe_hdr_bss |
| dbo | oe_hdr_cc_freight_estimate |
| dbo | oe_hdr_construction_info |
| dbo | oe_hdr_fedex_info |
| dbo | oe_hdr_fedex_info_detail |
| dbo | oe_hdr_fidelitone_po |
| dbo | oe_hdr_mfr |
| dbo | oe_hdr_not_delete |
| dbo | oe_hdr_notepad |
| dbo | oe_hdr_progress_billing |
| dbo | oe_hdr_rma |
| dbo | oe_hdr_ship_location |
| dbo | oe_hdr_shipserv |
| dbo | oe_hdr_source_loc_override |
| dbo | oe_hdr_status |
| dbo | oe_hdr_tax |
| dbo | oe_hdr_u_of_michigan |
| dbo | oe_hdr_uom_conversion |
| dbo | oe_hdr_vat |
| dbo | oe_line |
| dbo | oe_line_1000 |
| dbo | oe_line_194 |
| dbo | oe_line_230 |
| dbo | oe_line_235 |
| dbo | oe_line_265 |
| dbo | oe_line_523 |
| dbo | oe_line_982 |
| dbo | oe_line_alternate |
| dbo | oe_line_bss |
| dbo | oe_line_class |
| dbo | oe_line_component |
| dbo | oe_line_consignment |
| dbo | oe_line_cost_category |
| dbo | oe_line_cost_code |
| dbo | oe_line_dealer_commission |
| dbo | oe_line_eco_fee |
| dbo | oe_line_excise_tax |
| dbo | oe_line_fidelitone_po |
| dbo | oe_line_freight |
| dbo | oe_line_hose_assembly |
| dbo | oe_line_insurance |
| dbo | oe_line_label_group |
| dbo | oe_line_labor |
| dbo | oe_line_loa_price_edit |
| dbo | oe_line_lot |
| dbo | oe_line_lot_billing |
| dbo | oe_line_notepad |
| dbo | oe_line_panel |
| dbo | oe_line_pass_through |
| dbo | oe_line_po |
| dbo | oe_line_promise_date |
| dbo | oe_line_quote_info_27 |
| dbo | oe_line_rma |
| dbo | oe_line_room |
| dbo | oe_line_samples |
| dbo | oe_line_schedule |
| dbo | oe_line_serial |
| dbo | oe_line_service |
| dbo | oe_line_service_labor |
| dbo | oe_line_service_labor_tax |
| dbo | oe_line_service_labor_time |
| dbo | oe_line_service_ud |
| dbo | oe_line_special_purchase |
| dbo | oe_line_status |
| dbo | oe_line_subtotal_options |
| dbo | oe_line_tax |
| dbo | oe_line_ud |
| dbo | oe_line_valve |
| dbo | oe_line_x_employee |
| dbo | oe_message_log |
| dbo | oe_pick_ticket |
| dbo | oe_pick_ticket_consolidate |
| dbo | oe_pick_ticket_detail |
| dbo | oe_pick_ticket_detail_box |
| dbo | oe_pick_ticket_detail_pkg |
| dbo | oe_pick_ticket_detail_room |
| dbo | oe_pick_ticket_detail_trackabout |
| dbo | oe_pick_ticket_freight_info |
| dbo | oe_pick_ticket_package |
| dbo | oe_pick_ticket_signature |
| dbo | oe_pick_ticket_trackabout |
| dbo | oe_pick_ticket_ups |
| dbo | oe_schedule |
| dbo | oe_schedule_detail |
| dbo | operation |
| dbo | ota_delivery |
| dbo | outlook_error_log |
| dbo | output_audit_trail |
| dbo | p21_database_changes |
| dbo | p21_dblevel |
| dbo | p21_deletion_other_columns |
| dbo | p21_deletion_sql |
| dbo | p21_eda_incremental_bookings |
| dbo | p21_ext_integration_info |
| dbo | p21_ext_integration_log |
| dbo | p21_ext_integration_queue |
| dbo | p21_fulltext_catalog |
| dbo | p21_fulltext_index_column |
| dbo | p21_fulltext_index_table |
| dbo | p21_integration |
| dbo | p21_integration_x_scheduled_job |
| dbo | p21_number |
| dbo | p21_price_engine_run |
| dbo | p21_price_engine_run_audit_deleted_contracts |
| dbo | p21_price_engine_run_audit_deleted_price_pages |
| dbo | p21_price_engine_run_audit_step |
| dbo | p21_price_engine_run_audit_step_data |
| dbo | p21_price_engine_run_error_log |
| dbo | p21_price_engine_run_job_price_line |
| dbo | p21_price_engine_run_price_page |
| dbo | p21_price_engine_run_price_page_break |
| dbo | p21_price_engine_run_results |
| dbo | p21_price_engine_run_settings |
| dbo | package |
| dbo | package_type |
| dbo | package_x_shipment |
| dbo | pallet_bol_hdr |
| dbo | pallet_bol_line |
| dbo | pallet_hdr |
| dbo | pallet_line |
| dbo | passive_rebate_exclusion |
| dbo | passive_rebate_hdr |
| dbo | passive_rebate_level |
| dbo | passive_rebate_line |
| dbo | pbcatcol |
| dbo | pbcatedt |
| dbo | pbcatfmt |
| dbo | pbcattbl |
| dbo | pbcatvld |
| dbo | pc_country |
| dbo | pc_language_def |
| dbo | pc_location_def |
| dbo | pc_message_def |
| dbo | pc_message_detail |
| dbo | pc_outline |
| dbo | pc_profile_def |
| dbo | pc_seqctl |
| dbo | pc_state |
| dbo | pc_time_zone |
| dbo | pc_user_def |
| dbo | pc_version |
| dbo | pc_window_def |
| dbo | pda_oelist_criteria |
| dbo | pda_oelist_hdr |
| dbo | pda_oelist_shipto |
| dbo | pdaship_delivery_data |
| dbo | pdaship_pick_hdr_data |
| dbo | pdaship_pick_line_data |
| dbo | pdaship_rma_hdr_data |
| dbo | pdaship_rma_line_data |
| dbo | pdaship_stop_data |
| dbo | pedimento |
| dbo | pegmost_oe_hdr |
| dbo | pending_alerts |
| dbo | pending_price_protection |
| dbo | pending_retroactive_rebates_info |
| dbo | period_journals |
| dbo | periods |
| dbo | pick_list_hdr |
| dbo | pick_list_hdr_x_oe_pick_ticket |
| dbo | pick_list_line |
| dbo | pick_ticket_serial |
| dbo | pl_collect_def |
| dbo | pl_group_collect |
| dbo | pl_group_def |
| dbo | pl_group_object |
| dbo | pl_object_collect |
| dbo | pl_object_def |
| dbo | pl_profile_group |
| dbo | pl_user_collect |
| dbo | pl_user_object |
| dbo | pmt_type_x_comm_reduction |
| dbo | po_acknowledgement |
| dbo | po_acknowledgement_hdr |
| dbo | po_acknowledgement_line |
| dbo | po_asn_hdr |
| dbo | po_asn_line |
| dbo | po_deletion_po_hdr |
| dbo | po_hdr |
| dbo | po_hdr_not_delete |
| dbo | po_hdr_notepad |
| dbo | po_hdr_ud |
| dbo | po_hdr_x_jc_job |
| dbo | po_line |
| dbo | po_line_108 |
| dbo | po_line_27 |
| dbo | po_line_delivery_info |
| dbo | po_line_disputed_voucher |
| dbo | po_line_notepad |
| dbo | po_line_schedule |
| dbo | po_line_vessel_6 |
| dbo | po_line_x_lot_attribute_value |
| dbo | po_receipt_voucher_194 |
| dbo | po_schedule |
| dbo | po_schedule_receipts |
| dbo | po_schedule_rule |
| dbo | po_shipment_tracking |
| dbo | pod_document_template |
| dbo | pool_liner_info |
| dbo | pool_liner_pattern |
| dbo | pool_liner_process |
| dbo | pool_liner_process_defaults |
| dbo | pool_liner_processing |
| dbo | pool_liner_slot |
| dbo | pool_position |
| dbo | pool_pricing_code |
| dbo | pool_pricing_code_break |
| dbo | popup_column |
| dbo | popup_detail |
| dbo | popup_field |
| dbo | popup_field_behavior |
| dbo | popup_field_value |
| dbo | popup_index |
| dbo | popup_onfly_setup |
| dbo | popup_statement |
| dbo | popup_x_popup |
| dbo | predefined_coa |
| dbo | predefined_fin_rpt_row_x_acct |
| dbo | preference |
| dbo | price_book |
| dbo | price_book_additional_info |
| dbo | price_book_x_location |
| dbo | price_cache |
| dbo | price_family |
| dbo | price_family_x_restricted_class |
| dbo | price_method |
| dbo | price_override_exception |
| dbo | price_page |
| dbo | price_page_1266 |
| dbo | price_page_dealer_commission |
| dbo | price_page_discgrp |
| dbo | price_page_location |
| dbo | price_page_po_cost_calc |
| dbo | price_page_pricefam |
| dbo | price_page_prodgrp |
| dbo | price_page_source |
| dbo | price_page_suppdisc |
| dbo | price_page_supplier |
| dbo | price_page_suppmfg |
| dbo | price_page_supppricefam |
| dbo | price_page_suppprod |
| dbo | price_page_type_x_company |
| dbo | price_page_x_book |
| dbo | price_source_x_company |
| dbo | pricing_matrix_region |
| dbo | pricing_service_catalog |
| dbo | pricing_service_code |
| dbo | pricing_service_code_detail |
| dbo | pricing_service_column |
| dbo | pricing_service_conversion |
| dbo | pricing_service_extension |
| dbo | pricing_service_filter |
| dbo | pricing_service_layout |
| dbo | pricing_service_layout_detail |
| dbo | pricing_service_layout_loc |
| dbo | pricing_service_log |
| dbo | pricing_service_value |
| dbo | pricing_service_value_detail |
| dbo | pricing_template |
| dbo | pricing_template_key_field |
| dbo | pricing_template_location |
| dbo | pricing_template_location_dflt |
| dbo | printer_detail |
| dbo | printer_hdr |
| dbo | printer_x_form |
| dbo | pro_forma_info |
| dbo | problem_code |
| dbo | proc_x_trans_det_x_po_hdr |
| dbo | process |
| dbo | process_in_progress_lock |
| dbo | process_notepad |
| dbo | process_po_shipment_hdr |
| dbo | process_x_trans_x_oe_line |
| dbo | process_x_transaction |
| dbo | process_x_transaction_detail |
| dbo | process_x_transaction_not_delete |
| dbo | process_x_transaction_note |
| dbo | prod_group_strategic_hdr |
| dbo | prod_group_strategic_line |
| dbo | prod_line_component_labor |
| dbo | prod_ord_hdr_not_delete |
| dbo | prod_ord_line_compnt_x_oe_line |
| dbo | prod_ord_line_po |
| dbo | prod_pick_ticket_detail |
| dbo | prod_pick_ticket_hdr |
| dbo | prodord_tech_default_shift |
| dbo | promotional_group_det |
| dbo | promotional_group_hdr |
| dbo | prorate_reason_detail |
| dbo | prorate_reason_hdr |
| dbo | pt_dtl_bill_hold_bin |
| dbo | purch_type |
| dbo | purchase_acct_group_hdr |
| dbo | purchase_acct_group_line |
| dbo | purchase_class |
| dbo | purchase_class_x_location |
| dbo | purchase_criteria |
| dbo | purchase_pricing_book |
| dbo | purchase_pricing_page |
| dbo | purchase_pricing_page_1266 |
| dbo | purchase_transfer_group |
| dbo | purchase_transfer_locations |
| dbo | putaway_trace |
| dbo | quality_code |
| dbo | quote_hdr |
| dbo | quote_line |
| dbo | quote_lot |
| dbo | quote_revision |
| dbo | rate_or_fee_mx |
| dbo | reason |
| dbo | reason_code |
| dbo | rebate_receipts_detail |
| dbo | recon_layout_dtl_auto_je |
| dbo | recon_layout_dtl_auto_je_acct |
| dbo | reconciliation_layout_detail |
| dbo | reconciliation_layout_hdr |
| dbo | refrigerant_type |
| dbo | region |
| dbo | region_x_branch |
| dbo | remittances |
| dbo | remittances_detail |
| dbo | repair_transfers |
| dbo | repeat_je |
| dbo | resource_monitor |
| dbo | restricted_class |
| dbo | return_transfer_criteria |
| dbo | revision_transaction |
| dbo | rf_keys_default |
| dbo | rf_terminal |
| dbo | rfnavigator_sync_dump_batch |
| dbo | rfnavigator_sync_dump_batch_dtl |
| dbo | rfnavigator_upload_log |
| dbo | rfnavigator_upload_queue |
| dbo | ribbon |
| dbo | ribbon_tab |
| dbo | ribbon_tab_group |
| dbo | ribbon_tab_group_x_ribbon_tab |
| dbo | ribbon_tab_x_ribbon |
| dbo | ribbon_tool |
| dbo | ribbon_tool_x_ribbon_tab_group |
| dbo | rma_receipt_hdr |
| dbo | rma_receipt_line |
| dbo | roadnet_pod |
| dbo | roadnet_routing |
| dbo | roles |
| dbo | roles_loa |
| dbo | roles_price_controls |
| dbo | roles_ud |
| dbo | roles_x_activity |
| dbo | roles_x_hold_class |
| dbo | room |
| dbo | room_x_oe_hdr |
| dbo | rounding_installment_10005 |
| dbo | routeview_batch_dtl |
| dbo | routeview_batch_hdr |
| dbo | salutation |
| dbo | scan_pack |
| dbo | scan_pack_container_detail |
| dbo | scan_pack_container_detail_tag |
| dbo | scan_pack_container_hdr |
| dbo | scheduled_impmst_addlpath_194 |
| dbo | scheduled_job |
| dbo | scheduled_job_feature |
| dbo | scheduled_job_feature_type |
| dbo | scheduled_job_notifications |
| dbo | scheduled_job_user_notifications |
| dbo | scheduled_job_x_roles |
| dbo | scheduled_job_x_users |
| dbo | script_command |
| dbo | script_status |
| dbo | serial_number |
| dbo | serial_number_extd_info |
| dbo | serial_x_lot |
| dbo | service_center |
| dbo | service_center_x_machine |
| dbo | service_code |
| dbo | service_cycle |
| dbo | service_labor |
| dbo | service_labor_location |
| dbo | service_labor_process_dtl |
| dbo | service_labor_process_hdr |
| dbo | service_labor_rate |
| dbo | service_labor_rate_x_cust |
| dbo | service_labor_schedule |
| dbo | service_labor_x_tax_group_hdr |
| dbo | service_level_agreement |
| dbo | service_plan |
| dbo | service_pm_notice_msg |
| dbo | service_signature |
| dbo | service_technician |
| dbo | service_technician_x_labor |
| dbo | service_technician_x_service_center |
| dbo | servicebench_credit_memo |
| dbo | shift |
| dbo | ship_to |
| dbo | ship_to_194 |
| dbo | ship_to_2186 |
| dbo | ship_to_335 |
| dbo | ship_to_address_x_restricted_class |
| dbo | ship_to_blind_addressing |
| dbo | ship_to_CAD_initiator_audit |
| dbo | ship_to_credit |
| dbo | ship_to_CUCO_initiator_audit |
| dbo | ship_to_CUS_initiator_audit |
| dbo | ship_to_dea |
| dbo | ship_to_eco_fee |
| dbo | ship_to_fedex |
| dbo | ship_to_form_template |
| dbo | ship_to_freight_group |
| dbo | ship_to_freight_multiplier |
| dbo | ship_to_geocom |
| dbo | ship_to_gpo |
| dbo | ship_to_iva_tax |
| dbo | ship_to_jurisdiction |
| dbo | ship_to_location_priority |
| dbo | ship_to_notepad |
| dbo | ship_to_packing_list |
| dbo | ship_to_pumpoff |
| dbo | ship_to_tax_exceptions |
| dbo | ship_to_tax_exemption |
| dbo | ship_to_tax_state_exempt |
| dbo | ship_to_vat |
| dbo | shipment |
| dbo | shipping_containers_hdr |
| dbo | shipping_containers_line |
| dbo | shipping_containers_line_temp |
| dbo | shipping_country_code |
| dbo | shipping_document_template |
| dbo | shipping_group |
| dbo | shipping_group_hdr |
| dbo | shipping_group_line |
| dbo | shipping_integration_msg_handling |
| dbo | shipping_iva_tax |
| dbo | shipping_log |
| dbo | shipping_package_type |
| dbo | shipping_route |
| dbo | shipping_route_day_range |
| dbo | shipping_zone_hdr |
| dbo | shipping_zone_line |
| dbo | shopper |
| dbo | sic |
| dbo | skid_consolidation |
| dbo | skillset |
| dbo | soa_async_request |
| dbo | soa_consumer |
| dbo | sort_dragdrop |
| dbo | spa_slots |
| dbo | ssis_shopping_list_contract |
| dbo | stage |
| dbo | stage_notepad |
| dbo | stage_po_description_temp |
| dbo | stage_x_process |
| dbo | state |
| dbo | state_alt_loc |
| dbo | state_mx |
| dbo | statement_frequency |
| dbo | stop |
| dbo | store_credit_hdr |
| dbo | store_original_datastream |
| dbo | strat_price_factor_detail |
| dbo | strat_price_factor_hdr |
| dbo | strategic_pricing_oe_info |
| dbo | strategic_pricing_role |
| dbo | supplier |
| dbo | supplier_1348 |
| dbo | supplier_194 |
| dbo | supplier_attribute_group |
| dbo | supplier_claim_detail |
| dbo | supplier_failure_code |
| dbo | supplier_fascor_wms |
| dbo | supplier_form_template |
| dbo | supplier_group_hdr |
| dbo | supplier_group_line |
| dbo | supplier_lead_time |
| dbo | supplier_list_price |
| dbo | supplier_lot |
| dbo | supplier_nickname |
| dbo | supplier_notepad |
| dbo | supplier_notification_method |
| dbo | supplier_po_disc_group |
| dbo | supplier_po_rcpt_issue_msg |
| dbo | supplier_price_protection |
| dbo | supplier_pricing |
| dbo | supplier_pricing_detail |
| dbo | supplier_purchase_info |
| dbo | supplier_serial_template |
| dbo | supplier_STK_initiator_audit |
| dbo | supplier_trade |
| dbo | supplier_ud |
| dbo | supplier_weekly_truck_freight |
| dbo | supplier_x_restricted_class |
| dbo | supplier_zip_codes |
| dbo | swisslog_audit_trail |
| dbo | swisslog_confirmation |
| dbo | swisslog_transaction |
| dbo | swisslog_transaction_deleted |
| dbo | sysdiagrams |
| dbo | system_alerts |
| dbo | system_setting |
| dbo | tag_created_from_rebuild_info |
| dbo | tag_detail |
| dbo | tag_detail_audit |
| dbo | tag_document_line |
| dbo | tag_hdr |
| dbo | tag_hold_class |
| dbo | tag_picking_criteria |
| dbo | tax_exception_list |
| dbo | tax_exception_list_x_ship_to |
| dbo | tax_exempt_reason |
| dbo | tax_exemption_dtl |
| dbo | tax_exemption_hdr |
| dbo | tax_group_hdr |
| dbo | tax_group_hdr_zip |
| dbo | tax_group_line |
| dbo | tax_integration_error_log |
| dbo | tax_juris_date_range |
| dbo | tax_jurisdiction |
| dbo | tax_jurisdiction_schedule |
| dbo | tax_jurisdiction_x_tax_mx |
| dbo | tax_mx |
| dbo | tax_regime_mx |
| dbo | technician_clockinout |
| dbo | technician_clockinout_detail |
| dbo | technician_clockinout_pause |
| dbo | technician_default_shift |
| dbo | temp_counter_table |
| dbo | temp_credit_status |
| dbo | temp_dc_dupes |
| dbo | temp_dc_versions |
| dbo | temp_default_redo |
| dbo | temp_distranet_info |
| dbo | temp_distranet_zero_quantity |
| dbo | temp_ecc_enable_flag_update |
| dbo | temp_frac_bin |
| dbo | temp_frac_lot |
| dbo | temp_frac_lot_bin_xref |
| dbo | temp_fractional_adjustment |
| dbo | temp_imp_0000000003 |
| dbo | temp_imp_0000000003_key |
| dbo | temp_imp_0000000016 |
| dbo | temp_imp_0000000016_key |
| dbo | temp_job_price_hdr |
| dbo | temp_pick_ticket_cancel_audit |
| dbo | temp_rescale_container_receipts_line |
| dbo | temp_rescale_document_line_bin |
| dbo | temp_rescale_document_line_lot |
| dbo | temp_rescale_document_line_lot_bin_xref |
| dbo | temp_rescale_fifo_layer_transaction_cost |
| dbo | temp_rescale_fifo_layer_transaction_quantity |
| dbo | temp_rescale_fifo_layers_cost |
| dbo | temp_rescale_fifo_layers_qty |
| dbo | temp_rescale_lot_bin_xref_qty |
| dbo | temp_rescale_lot_cost |
| dbo | temp_rescale_lot_qty |
| dbo | temp_rescale_oe_line_pricing_unit_size |
| dbo | temp_rescale_oe_line_schedule |
| dbo | temp_rescale_oe_line_unit_price |
| dbo | temp_rescale_oe_line_unit_size |
| dbo | temp_rescale_oe_pick_ticket_detail |
| dbo | temp_rescale_po_line_pricing_unit_size |
| dbo | temp_rescale_po_line_schedule |
| dbo | temp_rescale_po_line_unit_price |
| dbo | temp_rescale_po_line_unit_size |
| dbo | temp_rescale_prod_pick_ticket_detail |
| dbo | temp_rescale_rma_receipt_line |
| dbo | temp_rescale_transfer_line |
| dbo | temp_rescale_transfer_shipment_line |
| dbo | temp_rescale_uom |
| dbo | temp_rescale_vessel_receipts_line |
| dbo | temp_slab_bin_disable |
| dbo | temp_syscolumns |
| dbo | temp_sysobjects |
| dbo | temp_tag_build_repair |
| dbo | temp_tag_detail_info |
| dbo | temp_tag_document_line_info |
| dbo | temp_tag_hdr_info |
| dbo | temp_tag_no_default |
| dbo | temp_temp |
| dbo | temp_ud_key_update |
| dbo | temp_upgrade_error |
| dbo | ten99_audit_trail |
| dbo | ten99_balances |
| dbo | term_x_language |
| dbo | terms |
| dbo | terms_user_defined_days |
| dbo | territory |
| dbo | territory_grp |
| dbo | territory_x_ship_to |
| dbo | territory_x_territory_grp |
| dbo | test_data |
| dbo | test_data_hdr |
| dbo | test_data_segment |
| dbo | test_script_hdr |
| dbo | test_script_line |
| dbo | token |
| dbo | topic |
| dbo | tos_code |
| dbo | tpcx_disconnected_transaction |
| dbo | tpcx_inbound_document |
| dbo | tpcx_outbound_document |
| dbo | trackabout_empty_cylinder |
| dbo | trackabout_fill |
| dbo | trackabout_log |
| dbo | trackabout_truck |
| dbo | trade_layer |
| dbo | trade_layer_transaction |
| dbo | trailer |
| dbo | trans_set_x_xml_dataobject |
| dbo | trans_x_gl_dimension |
| dbo | trans_x_gl_dimension_audit_trail |
| dbo | transaction_set |
| dbo | transfer_bin_schedule |
| dbo | transfer_bin_schedule_exception |
| dbo | transfer_criteria |
| dbo | transfer_days |
| dbo | transfer_hdr |
| dbo | transfer_hdr_notepad |
| dbo | transfer_line |
| dbo | transfer_line_notepad |
| dbo | transfer_schedule_exception |
| dbo | transfer_shipment_hdr |
| dbo | transfer_shipment_line |
| dbo | transfer_tracking |
| dbo | translation_term |
| dbo | tripos_instance |
| dbo | tropic_addon |
| dbo | tropic_lotbin |
| dbo | tropic_lotbin_detail |
| dbo | tropic_po_expedite |
| dbo | tropic_po_gen_detail |
| dbo | tropic_po_gen_hdr |
| dbo | tropic_po_review |
| dbo | truck |
| dbo | ud_tabpage |
| dbo | unit |
| dbo | unit_of_measure |
| dbo | unit_of_measure_153 |
| dbo | unit_of_measure_mx |
| dbo | unit_of_measure_STK_initiator_audit |
| dbo | unit_x_udf |
| dbo | uom_x_uom_mx |
| dbo | ups_connectship_freight |
| dbo | user_assign_to |
| dbo | user_authority |
| dbo | user_code_hdr |
| dbo | user_code_line |
| dbo | user_configured_tabpage |
| dbo | user_defined_code |
| dbo | user_defined_column |
| dbo | user_defined_field |
| dbo | user_preference |
| dbo | user_window_pref |
| dbo | users |
| dbo | users_crm |
| dbo | users_direct_ship_edit |
| dbo | users_ud |
| dbo | users_x_branch |
| dbo | users_x_cash_drawer |
| dbo | users_x_company |
| dbo | users_x_location |
| dbo | users_x_oe_line_panel |
| dbo | value_list |
| dbo | value_list_value |
| dbo | valve_info |
| dbo | vat_code |
| dbo | vat_code_group_hdr |
| dbo | vat_code_group_line |
| dbo | vat_return_uk_mtd_submit |
| dbo | vat_return_uk_mtd_submit_det |
| dbo | vat_return_wkst |
| dbo | vat_return_wkst_x_trans |
| dbo | vat_x_transaction |
| dbo | vendor |
| dbo | vendor_111 |
| dbo | vendor_ach |
| dbo | vendor_ach_contacts |
| dbo | vendor_contract |
| dbo | vendor_contract_freight_factor_exclusion |
| dbo | vendor_contract_type |
| dbo | vendor_core_tracking |
| dbo | vendor_defaults |
| dbo | vendor_edi_setting |
| dbo | vendor_edi_transaction |
| dbo | vendor_edi_transaction_detail |
| dbo | vendor_eft |
| dbo | vendor_form_template |
| dbo | vendor_iva_tax |
| dbo | vendor_notepad |
| dbo | vendor_notification_method |
| dbo | vendor_pass_through |
| dbo | vendor_po_options |
| dbo | vendor_purchase_acct |
| dbo | vendor_rebate |
| dbo | vendor_rfq_hdr |
| dbo | vendor_rfq_hdr_x_oe_hdr |
| dbo | vendor_rfq_hdr_x_po_hdr |
| dbo | vendor_rfq_line |
| dbo | vendor_rfq_line_analysis |
| dbo | vendor_supplier |
| dbo | vendor_vat |
| dbo | vendor_vmi |
| dbo | vendor_vmi_x_location |
| dbo | vendor_wit |
| dbo | version_code |
| dbo | vessel_receipts_container |
| dbo | vessel_receipts_hdr |
| dbo | vessel_receipts_line |
| dbo | vessel_receipts_repair |
| dbo | vics_bill_of_lading |
| dbo | vics_bol_pallet |
| dbo | vics_bol_pallet_container |
| dbo | vies_rpt |
| dbo | voucher_automation_company_settings |
| dbo | voucher_class |
| dbo | voucher_purchase_acct |
| dbo | voucher_purchase_acct_edit |
| dbo | voucher_purchase_acct_edit_audit_trail |
| dbo | wee_tax_code |
| dbo | week |
| dbo | wf_ach_counter |
| dbo | window_tab_navigation |
| dbo | window_x_menu |
| dbo | wip_worksheet_hdr |
| dbo | wip_worksheet_x_assembly |
| dbo | wip_worksheet_x_component |
| dbo | wip_worksheet_x_labor |
| dbo | wireless_trans_audit_hdr |
| dbo | wireless_trans_audit_line |
| dbo | workbench |
| dbo | workbench_allocation_dflt |
| dbo | workbench_query_hdr |
| dbo | workbench_query_process |
| dbo | workbench_query_prod |
| dbo | workbench_query_pt |
| dbo | workbench_query_replenishment |
| dbo | workbench_query_transfer |
| dbo | workbench_queue |
| dbo | workbench_user_zone |
| dbo | workbench_x_users |
| dbo | workbench_x_users_pick |
| dbo | wwms_in_process |
| dbo | wwms_label_defaults |
| dbo | wwms_loc_session_defaults |
| dbo | wwms_receipt_defaults |
| dbo | wzd_prcs_sesn_state_p21 |
| dbo | wzd_prcs_status_p21 |
| dbo | wzd_prcs_x_wzd_sesn_p21 |
| dbo | wzd_process_ext_p21 |
| dbo | wzd_process_p21 |
| dbo | wzd_session_p21 |
| dbo | wzd_type_p21 |
| dbo | xml_dataobject |
| dbo | xml_dataobject_column |
| dbo | xml_dataobject_x_config |
| dbo | xml_document |
| dbo | xml_document_element |
| dbo | xml_stylesheet |
| dbo | z_lookup |
| dbo | zip_code |
| dbo | zip_code_coordinates |
| dbo | zip_code_local |
| dbo | zip_code_mx |
| ssb | dead_letter_office |
| ssb | trig_cash_transfer |
| ssb | trig_gl |
| ssb | trig_oe_hdr |
| ssb | trig_oe_line |
| ssb | trig_oe_pick_ticket |
| ssb | trig_oe_pick_ticket_detail |
| ssb | trig_voucher_purchase_acct_edit |
| UTIL | db_log |

### Detailed Table Information

#### dbo.__RefactorLog

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| operationkey | uniqueidentifier |  | NO |

#### dbo._TEMP_sku2

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| ID | varchar | 50 | YES |
| item_id | varchar | 50 | YES |
| price | varchar | 50 | YES |
| reg_price | varchar | 50 | YES |
| post_type | varchar | 50 | YES |
| post_status | varchar | 50 | YES |
| post_parent | varchar | 50 | YES |

#### dbo.accnt_group_mx

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| accnt_group_mx_uid | int |  | NO |
| accnt_group_mx_id | varchar | 255 | NO |
| group_description | varchar | 255 | YES |
| sequence_no | int |  | NO |
| row_status_flag | int |  | NO |
| date_created | datetime |  | NO |
| created_by | varchar | 255 | NO |
| date_last_modified | datetime |  | NO |
| last_maintained_by | varchar | 255 | NO |
| level | int |  | YES |

#### dbo.accnt_group_mx2

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| accnt_group_mx2_uid | int |  | NO |
| accnt_group_mx2_id | varchar | 255 | NO |
| group_description | varchar | 255 | YES |
| sequence_no | int |  | NO |
| row_status_flag | int |  | NO |
| date_created | datetime |  | NO |
| created_by | varchar | 255 | NO |
| date_last_modified | datetime |  | NO |
| last_maintained_by | varchar | 255 | NO |

#### dbo.accnts_x_accnt_group

**Columns:**

| Column Name | Data Type | Length | Nullable |
|-------------|-----------|--------|----------|
| accnts_x_accnt_group_uid | int |  | NO |
| company_no | varchar | 8 | NO |
| account_no | varchar | 32 | NO |
| accnt_group_mx_uid | int |  | YES |
| row_status_flag | int |  | NO |
| date_created | datetime |  | NO |
| created_by | varchar | 255 | NO |
| date_last_modified | datetime |  | NO |
| last_maintained_by | varchar | 255 | NO |
| accnt_group_mx2_uid | int |  | YES |

*Note: Only showing details for the first 5 tables in this category. 1472 more tables exist.*

