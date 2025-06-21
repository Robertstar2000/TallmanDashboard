import fs from 'fs';
import path from 'path';

interface LdapServerConfig {
  url: string;
  bindDN: string;
  bindCredentials?: string;
  searchBase: string;
  searchFilter: string;
  searchAttributes?: string[];
  tlsOptions?: Record<string, any>;
  groupSearchBase?: string;
  groupSearchFilter?: string;
  groupSearchAttributes?: string[];
  groupSearchScope?: 'base' | 'one' | 'sub';
  groupDNProperty?: string;
  reconnect?: boolean | { initialDelay?: number; maxDelay?: number; failAfter?: number };
}

interface LdapConfig {
  enabled: boolean;
  server: LdapServerConfig;
  userLoginAttr?: string; // Custom attribute for login (e.g. sAMAccountName)
  userRDN?: string; // e.g. 'uid'
  groupDN?: string; // e.g. 'ou=groups'
}

// Default configuration from environment variables
let ldapConfig: LdapConfig = {
  enabled: process.env.LDAP_ENABLED === 'true',
  server: {
    url: process.env.LDAP_URL || '', // e.g., 'ldap://localhost:389'
    bindDN: process.env.LDAP_BIND_DN || '',
    bindCredentials: process.env.LDAP_BIND_CREDENTIALS || '',
    searchBase: process.env.LDAP_SEARCH_BASE || '', // e.g., 'ou=users,dc=example,dc=com'
    searchFilter: process.env.LDAP_SEARCH_FILTER || '(uid={{username}})', // passport-ldapauth replaces {{username}}
    searchAttributes: (process.env.LDAP_SEARCH_ATTRIBUTES?.split(',')) || ['displayName', 'mail', 'uid'],
    tlsOptions: {
      rejectUnauthorized: process.env.LDAP_TLS_REJECT_UNAUTHORIZED !== 'false'
    },
    reconnect: true
  },
  userLoginAttr: process.env.LDAP_USER_LOGIN_ATTR || 'uid',
};

// Try to load overrides from a JSON config file
// Assumes data/config.json is at the project root
try {
  const configPath = path.join(__dirname, '..', '..', 'data', 'config.json');
  if (fs.existsSync(configPath)) {
    const fileConfigContent = fs.readFileSync(configPath, 'utf8');
    const fileConfig = JSON.parse(fileConfigContent);

    if (fileConfig.ldap) {
      const fcLdap = fileConfig.ldap;
      ldapConfig.enabled = fcLdap.enabled !== undefined ? fcLdap.enabled : ldapConfig.enabled;
      
      const serverUrl = fcLdap.server_url || 
                        (fcLdap.server && fcLdap.port ? 
                          `${fcLdap.use_ssl ? 'ldaps' : 'ldap'}://${fcLdap.server}:${fcLdap.port}` : 
                          ldapConfig.server.url);

      ldapConfig.server = {
        ...ldapConfig.server, // Keep defaults like reconnect
        url: serverUrl,
        bindDN: fcLdap.bind_user_dn || ldapConfig.server.bindDN,
        bindCredentials: fcLdap.bind_user_password || ldapConfig.server.bindCredentials,
        searchBase: fcLdap.base_dn || ldapConfig.server.searchBase,
        searchFilter: fcLdap.user_object_filter || ldapConfig.server.searchFilter,
        searchAttributes: fcLdap.search_attributes || ldapConfig.server.searchAttributes,
        tlsOptions: {
          rejectUnauthorized: fcLdap.use_ssl !== false // if use_ssl is true, rejectUnauthorized should be true
        }
      };
      ldapConfig.userLoginAttr = fcLdap.user_login_attr || ldapConfig.userLoginAttr;
      ldapConfig.userRDN = fcLdap.user_rdn || ldapConfig.userRDN;
      ldapConfig.groupDN = fcLdap.group_dn || ldapConfig.groupDN;
    }
  }
} catch (error) {
  console.error('Error loading LDAP configuration from data/config.json:', error);
  // Proceed with environment variable based config or defaults
}

export default ldapConfig;
