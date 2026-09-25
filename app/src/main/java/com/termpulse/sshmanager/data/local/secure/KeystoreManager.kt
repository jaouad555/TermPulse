package com.termpulse.sshmanager.data.local.secure

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class KeystoreManager(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .setUserAuthenticationRequired(false)
        .build()

    private val sharedPreferences: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "termpulse_secure_vault",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun storeSecret(serverId: String, secret: String) {
        sharedPreferences.edit()
            .putString("secret_$serverId", secret)
            .apply()
    }

    fun getSecret(serverId: String): String? {
        return sharedPreferences.getString("secret_$serverId", null)
    }

    fun storePassphrase(serverId: String, passphrase: String) {
        sharedPreferences.edit()
            .putString("passphrase_$serverId", passphrase)
            .apply()
    }

    fun getPassphrase(serverId: String): String? {
        return sharedPreferences.getString("passphrase_$serverId", null)
    }

    fun removeSecrets(serverId: String) {
        sharedPreferences.edit()
            .remove("secret_$serverId")
            .remove("passphrase_$serverId")
            .apply()
    }

    fun clearAll() {
        sharedPreferences.edit().clear().apply()
    }
}
